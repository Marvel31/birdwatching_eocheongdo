import { StatusBar } from "expo-status-bar";
import { useMemo, useState } from "react";
import {
  FlatList,
  Image,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  StyleProp,
  Text,
  View,
  ViewStyle
} from "react-native";

import album from "./data/album.json";
import { PhotoKey, photos } from "./data/photos";

type Tab = "home" | "birds" | "trip";
type BirdView = "names" | "thumbs";

type SelectedPhoto = {
  key: PhotoKey;
  title: string;
  subtitle?: string;
};

function getPhoto(key: string) {
  return photos[key as PhotoKey];
}

export default function App() {
  const [tab, setTab] = useState<Tab>("home");
  const [birdView, setBirdView] = useState<BirdView>("names");
  const [selectedPhoto, setSelectedPhoto] = useState<SelectedPhoto | null>(null);

  const birdPhotoItems = useMemo(
    () =>
      album.birds.flatMap((bird) =>
        bird.photos.map((photo, index) => ({
          id: `${bird.id}-${photo}`,
          birdId: bird.id,
          name: bird.name,
          photo,
          index
        }))
      ),
    []
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.app}>
        <View style={styles.header}>
          <Text style={styles.appTitle}>Bird Album</Text>
          <Text style={styles.appSubtitle}>{album.trip.title}</Text>
        </View>

        <View style={styles.tabs}>
          <TabButton active={tab === "home"} label={"\uD648"} onPress={() => setTab("home")} />
          <TabButton active={tab === "birds"} label={"\uAD00\uCC30 \uC0C8"} onPress={() => setTab("birds")} />
          <TabButton active={tab === "trip"} label={"\uC5EC\uD589 \uC0AC\uC9C4"} onPress={() => setTab("trip")} />
        </View>

        {tab === "home" ? <HomeScreen onOpenPhoto={setSelectedPhoto} /> : null}
        {tab === "birds" ? (
          <BirdsScreen
            birdPhotoItems={birdPhotoItems}
            birdView={birdView}
            onChangeView={setBirdView}
            onOpenPhoto={setSelectedPhoto}
          />
        ) : null}
        {tab === "trip" ? <TripPhotosScreen onOpenPhoto={setSelectedPhoto} /> : null}

        <PhotoModal photo={selectedPhoto} onClose={() => setSelectedPhoto(null)} />
      </View>
    </SafeAreaView>
  );
}

function HomeScreen({ onOpenPhoto }: { onOpenPhoto: (photo: SelectedPhoto) => void }) {
  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <Pressable
        style={styles.coverFrame}
        onPress={() =>
          onOpenPhoto({
            key: album.trip.coverPhoto as PhotoKey,
            title: album.trip.title,
            subtitle: album.trip.location
          })
        }
      >
        <Image source={getPhoto(album.trip.coverPhoto)} style={styles.coverImage} resizeMode="contain" />
      </Pressable>

      <View style={styles.tripInfo}>
        <Text style={styles.tripTitle}>{album.trip.title}</Text>
        <Text style={styles.tripMeta}>{album.trip.date}</Text>
        <Text style={styles.tripMeta}>{album.trip.location}</Text>
      </View>
    </ScrollView>
  );
}

function BirdsScreen({
  birdPhotoItems,
  birdView,
  onChangeView,
  onOpenPhoto
}: {
  birdPhotoItems: Array<{ id: string; birdId: string; name: string; photo: string; index: number }>;
  birdView: BirdView;
  onChangeView: (view: BirdView) => void;
  onOpenPhoto: (photo: SelectedPhoto) => void;
}) {
  return (
    <View style={styles.screen}>
      <View style={styles.segment}>
        <SegmentButton active={birdView === "names"} label={"\uC774\uB984"} onPress={() => onChangeView("names")} />
        <SegmentButton active={birdView === "thumbs"} label={"\uC378\uB124\uC77C"} onPress={() => onChangeView("thumbs")} />
      </View>

      {birdView === "names" ? (
        <FlatList
          data={album.birds}
          key="bird-names"
          contentContainerStyle={styles.listContent}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Pressable
              style={styles.nameRow}
              onPress={() =>
                onOpenPhoto({
                  key: item.photos[0] as PhotoKey,
                  title: item.name,
                  subtitle: `${item.photos.length}\uC7A5`
                })
              }
            >
              <Text style={styles.nameText}>{item.name}</Text>
              <Text style={styles.rowHint}>{item.photos.length}{"\uC7A5"}</Text>
            </Pressable>
          )}
        />
      ) : (
        <FlatList
          data={birdPhotoItems}
          key="bird-thumbs"
          numColumns={2}
          contentContainerStyle={styles.gridContent}
          columnWrapperStyle={styles.gridRow}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Thumbnail
              caption={item.name}
              photo={item.photo}
              onPress={() =>
                onOpenPhoto({
                  key: item.photo as PhotoKey,
                  title: item.name,
                  subtitle: `${item.index + 1}\uBC88\uC9F8 \uC0AC\uC9C4`
                })
              }
            />
          )}
        />
      )}
    </View>
  );
}

function TripPhotosScreen({ onOpenPhoto }: { onOpenPhoto: (photo: SelectedPhoto) => void }) {
  return (
    <FlatList
      data={album.tripPhotos}
      numColumns={2}
      contentContainerStyle={styles.gridContent}
      columnWrapperStyle={styles.gridRow}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <Thumbnail
          caption={item.caption}
          frameStyle={styles.tripThumbFrame}
          photo={item.photo}
          onPress={() =>
            onOpenPhoto({
              key: item.photo as PhotoKey,
              title: item.caption,
              subtitle: album.trip.title
            })
          }
        />
      )}
    />
  );
}

function Thumbnail({
  caption,
  frameStyle,
  photo,
  onPress
}: {
  caption: string;
  frameStyle?: StyleProp<ViewStyle>;
  photo: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.thumb} onPress={onPress}>
      <View style={[styles.thumbFrame, frameStyle]}>
        <Image source={getPhoto(photo)} style={styles.thumbImage} resizeMode="contain" />
      </View>
      <Text numberOfLines={1} style={styles.thumbCaption}>
        {caption}
      </Text>
    </Pressable>
  );
}

function PhotoModal({ photo, onClose }: { photo: SelectedPhoto | null; onClose: () => void }) {
  return (
    <Modal visible={photo !== null} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modal}>
        <Pressable style={styles.modalCloseArea} onPress={onClose} />
        {photo ? (
          <View style={styles.modalContent}>
            <Image source={photos[photo.key]} style={styles.modalImage} resizeMode="contain" />
            <View style={styles.modalText}>
              <Text style={styles.modalTitle}>{photo.title}</Text>
              {photo.subtitle ? <Text style={styles.modalSubtitle}>{photo.subtitle}</Text> : null}
            </View>
            <Pressable style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>{"\uB2EB\uAE30"}</Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

function TabButton({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable style={[styles.tabButton, active && styles.tabButtonActive]} onPress={onPress}>
      <Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text>
    </Pressable>
  );
}

function SegmentButton({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable style={[styles.segmentButton, active && styles.segmentButtonActive]} onPress={onPress}>
      <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f7f5ef"
  },
  app: {
    flex: 1,
    marginHorizontal: "auto",
    maxWidth: 520,
    width: "100%",
    backgroundColor: "#f7f5ef"
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12
  },
  appTitle: {
    color: "#263126",
    fontSize: 26,
    fontWeight: "800"
  },
  appSubtitle: {
    color: "#60705f",
    fontSize: 14,
    marginTop: 3
  },
  tabs: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 14
  },
  tabButton: {
    alignItems: "center",
    borderColor: "#d7d1c5",
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    height: 42,
    justifyContent: "center"
  },
  tabButtonActive: {
    backgroundColor: "#2f5f53",
    borderColor: "#2f5f53"
  },
  tabText: {
    color: "#405044",
    fontSize: 14,
    fontWeight: "700"
  },
  tabTextActive: {
    color: "#ffffff"
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32
  },
  coverFrame: {
    aspectRatio: 4 / 3,
    backgroundColor: "#ddd6ca",
    borderRadius: 8,
    overflow: "hidden",
    width: "100%"
  },
  coverImage: {
    bottom: 0,
    height: "100%",
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
    width: "100%"
  },
  tripInfo: {
    paddingTop: 18
  },
  tripTitle: {
    color: "#222c24",
    fontSize: 24,
    fontWeight: "800"
  },
  tripMeta: {
    color: "#5f6b61",
    fontSize: 16,
    marginTop: 8
  },
  screen: {
    flex: 1
  },
  segment: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 8
  },
  segmentButton: {
    alignItems: "center",
    borderColor: "#d7d1c5",
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    height: 38,
    justifyContent: "center"
  },
  segmentButtonActive: {
    backgroundColor: "#dfe8dc",
    borderColor: "#8fa38c"
  },
  segmentText: {
    color: "#526155",
    fontSize: 14,
    fontWeight: "700"
  },
  segmentTextActive: {
    color: "#20382f"
  },
  listContent: {
    padding: 16,
    paddingTop: 8
  },
  nameRow: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "#e4dfd5",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    minHeight: 58,
    paddingHorizontal: 16
  },
  nameText: {
    color: "#263126",
    fontSize: 17,
    fontWeight: "800"
  },
  rowHint: {
    color: "#748073",
    fontSize: 13
  },
  gridContent: {
    padding: 16,
    paddingTop: 8
  },
  gridRow: {
    gap: 12
  },
  thumb: {
    backgroundColor: "#ffffff",
    borderColor: "#e4dfd5",
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    marginBottom: 12,
    overflow: "hidden"
  },
  thumbFrame: {
    aspectRatio: 1,
    backgroundColor: "#ddd6ca",
    overflow: "hidden",
    width: "100%"
  },
  thumbImage: {
    bottom: 0,
    height: "100%",
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
    width: "100%"
  },
  tripThumbFrame: {
    aspectRatio: 4 / 3
  },
  thumbCaption: {
    color: "#263126",
    fontSize: 14,
    fontWeight: "700",
    paddingHorizontal: 10,
    paddingVertical: 10
  },
  modal: {
    backgroundColor: "rgba(17, 22, 18, 0.88)",
    flex: 1,
    justifyContent: "center",
    padding: 18
  },
  modalCloseArea: {
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0
  },
  modalContent: {
    alignItems: "center",
    width: "100%"
  },
  modalImage: {
    aspectRatio: 4 / 3,
    backgroundColor: "#111612",
    maxHeight: "76%",
    width: "100%"
  },
  modalText: {
    alignItems: "center",
    paddingTop: 14
  },
  modalTitle: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "800"
  },
  modalSubtitle: {
    color: "#d9ded7",
    fontSize: 14,
    marginTop: 5
  },
  closeButton: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 8,
    height: 42,
    justifyContent: "center",
    marginTop: 16,
    width: 96
  },
  closeButtonText: {
    color: "#263126",
    fontSize: 14,
    fontWeight: "800"
  }
});
