import { StatusBar as ExpoStatusBar } from "expo-status-bar";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  Image,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar as NativeStatusBar,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle
} from "react-native";

import album from "./data/album.json";
import { PhotoKey, photos } from "./data/photos";

type Tab = "home" | "birds" | "trip";
type BirdView = "names" | "thumbs";

const APP_TITLE = "어청도 탐조 여행";
const APP_SUBTITLE = "어청도 bird album";
const ANDROID_STATUS_BAR_HEIGHT = Platform.OS === "android" ? NativeStatusBar.currentHeight ?? 0 : 0;

type ViewerPhoto = {
  key: PhotoKey;
  title: string;
  subtitle?: string;
};

type BirdPhotoItem = {
  id: string;
  birdId: string;
  name: string;
  photo: string | null;
  index: number;
};

type SelectedPhoto = ViewerPhoto & {
  photos: ViewerPhoto[];
  index: number;
};

function getPhoto(key: string) {
  return photos[key as PhotoKey];
}

function getRequiredPhoto(key: string) {
  const photo = getPhoto(key);

  if (!photo) {
    console.warn(`Missing bundled photo asset: ${key}`);
  }

  return photo;
}

function getSelectedPhoto(items: ViewerPhoto[], index: number): SelectedPhoto {
  return {
    ...items[index],
    photos: items,
    index
  };
}

export default function App() {
  const [tab, setTab] = useState<Tab>("home");
  const [birdView, setBirdView] = useState<BirdView>("thumbs");
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<SelectedPhoto | null>(null);

  const birdPhotoItems = useMemo<BirdPhotoItem[]>(
    () =>
      album.birds.flatMap<BirdPhotoItem>((bird) => {
        if (bird.photos.length === 0) {
          return [
            {
              id: `${bird.id}-no-image`,
              birdId: bird.id,
              name: bird.name,
              photo: null,
              index: 0
            }
          ];
        }

        return bird.photos.map((photo, index) => ({
          id: `${bird.id}-${photo}`,
          birdId: bird.id,
          name: bird.name,
          photo,
          index
        }));
      }),
    []
  );

  const birdViewerItems = useMemo(
    () =>
      birdPhotoItems.flatMap((item) =>
        item.photo
          ? [
              {
                key: item.photo as PhotoKey,
                title: item.name,
                subtitle: `${item.index + 1}\uBC88\uC9F8 \uC0AC\uC9C4`
              }
            ]
          : []
      ),
    [birdPhotoItems]
  );

  const tripViewerItems = useMemo(
    () =>
      album.tripPhotos.map((item) => ({
        key: item.photo as PhotoKey,
        title: "",
        subtitle: APP_TITLE
      })),
    []
  );

  const changeTab = (nextTab: Tab) => {
    setTab(nextTab);
    setMenuOpen(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ExpoStatusBar style="dark" />
      <View style={styles.app}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.appTitle}>{APP_TITLE}</Text>
            <Text style={styles.appSubtitle}>{APP_SUBTITLE}</Text>
          </View>
          <Pressable
            accessibilityLabel="메뉴"
            style={[styles.menuButton, menuOpen && styles.menuButtonActive]}
            onPress={() => setMenuOpen((value) => !value)}
          >
            <MenuIcon active={menuOpen} />
          </Pressable>
          {menuOpen ? (
            <View style={styles.menuPanel}>
              <MenuItem active={tab === "home"} label={"\uD648"} onPress={() => changeTab("home")} />
              <MenuItem active={tab === "birds"} label={"\uAD00\uCC30 \uC0C8"} onPress={() => changeTab("birds")} />
              <MenuItem active={tab === "trip"} label={"\uC5EC\uD589 \uC0AC\uC9C4"} onPress={() => changeTab("trip")} />
            </View>
          ) : null}
        </View>

        {tab === "home" ? <HomeScreen /> : null}
        {tab === "birds" ? (
          <BirdsScreen
            birdPhotoItems={birdPhotoItems}
            birdViewerItems={birdViewerItems}
            birdView={birdView}
            onChangeView={setBirdView}
            onOpenPhoto={setSelectedPhoto}
          />
        ) : null}
        {tab === "trip" ? (
          <TripPhotosScreen onOpenPhoto={setSelectedPhoto} tripViewerItems={tripViewerItems} />
        ) : null}

        <PhotoModal photo={selectedPhoto} onChangePhoto={setSelectedPhoto} onClose={() => setSelectedPhoto(null)} />
      </View>
    </SafeAreaView>
  );
}

function HomeScreen() {
  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={styles.albumCover}>
        <Image source={getRequiredPhoto(album.trip.coverPhoto)} style={styles.albumCoverImage} resizeMode="cover" />
        <View style={styles.albumShade} />
        <View style={styles.albumLabel}>
          <Text style={styles.albumEyebrow}>FIELD NOTES</Text>
          <Text style={styles.albumTitle}>{APP_TITLE}</Text>
          <Text style={styles.albumMeta}>{album.trip.date}</Text>
        </View>
      </View>

      <View style={styles.albumDetails}>
        <View style={styles.albumStat}>
          <Text style={styles.albumStatValue}>{album.tripPhotos.length}</Text>
          <Text style={styles.albumStatLabel}>{"\uC5EC\uD589 \uC0AC\uC9C4"}</Text>
        </View>
        <View style={styles.albumStatDivider} />
        <View style={styles.albumStat}>
          <Text style={styles.albumStatValue}>{album.birds.length}</Text>
          <Text style={styles.albumStatLabel}>{"\uAD00\uCC30 \uC0C8"}</Text>
        </View>
        <View style={styles.albumStatDivider} />
        <View style={styles.albumStat}>
          <Text style={styles.albumStatValue}>3</Text>
          <Text style={styles.albumStatLabel}>{"\uAE30\uB85D\uC77C"}</Text>
        </View>
      </View>
    </ScrollView>
  );
}

function BirdsScreen({
  birdPhotoItems,
  birdViewerItems,
  birdView,
  onChangeView,
  onOpenPhoto
}: {
  birdPhotoItems: BirdPhotoItem[];
  birdViewerItems: ViewerPhoto[];
  birdView: BirdView;
  onChangeView: (view: BirdView) => void;
  onOpenPhoto: (photo: SelectedPhoto) => void;
}) {
  const openBirdPhoto = (photo: string | null) => {
    if (!photo) {
      return;
    }

    const index = Math.max(
      0,
      birdViewerItems.findIndex((item) => item.key === photo)
    );
    onOpenPhoto(getSelectedPhoto(birdViewerItems, index));
  };

  return (
    <View style={styles.screen}>
      <View style={styles.segment}>
        <SegmentIconButton active={birdView === "thumbs"} label="썸네일" type="grid" onPress={() => onChangeView("thumbs")} />
        <SegmentIconButton active={birdView === "names"} label="이름" type="list" onPress={() => onChangeView("names")} />
      </View>

      {birdView === "names" ? (
        <FlatList
          data={album.birds}
          key="bird-names"
          contentContainerStyle={styles.listContent}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Pressable style={styles.nameRow} disabled={item.photos.length === 0} onPress={() => openBirdPhoto(item.photos[0] ?? null)}>
              <Text style={styles.nameText}>{item.name}</Text>
              <Text style={styles.rowHint}>{item.photos.length > 0 ? `${item.photos.length}\uC7A5` : "No image"}</Text>
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
            <Thumbnail caption={item.name} photo={item.photo} onPress={() => openBirdPhoto(item.photo)} />
          )}
        />
      )}
    </View>
  );
}

function TripPhotosScreen({
  onOpenPhoto,
  tripViewerItems
}: {
  onOpenPhoto: (photo: SelectedPhoto) => void;
  tripViewerItems: ViewerPhoto[];
}) {
  return (
    <FlatList
      data={album.tripPhotos}
      numColumns={2}
      contentContainerStyle={styles.gridContent}
      columnWrapperStyle={styles.gridRow}
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) => (
        <Thumbnail
          caption={item.caption}
          frameStyle={styles.tripThumbFrame}
          photo={item.photo}
          showCaption={false}
          onPress={() => onOpenPhoto(getSelectedPhoto(tripViewerItems, index))}
        />
      )}
    />
  );
}

function Thumbnail({
  caption,
  frameStyle,
  photo,
  showCaption = true,
  onPress
}: {
  caption: string;
  frameStyle?: StyleProp<ViewStyle>;
  photo: string | null;
  showCaption?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.thumb} disabled={!photo} onPress={onPress}>
      <View style={[styles.thumbFrame, frameStyle]}>
        {photo ? (
          <Image source={getRequiredPhoto(photo)} style={styles.thumbImage} resizeMode="contain" resizeMethod="resize" />
        ) : (
          <View style={styles.noImage}>
            <Text style={styles.noImageText}>No image</Text>
          </View>
        )}
      </View>
      {showCaption ? (
        <Text numberOfLines={1} style={styles.thumbCaption}>
          {caption}
        </Text>
      ) : null}
    </Pressable>
  );
}

function PhotoModal({
  photo,
  onChangePhoto,
  onClose
}: {
  photo: SelectedPhoto | null;
  onChangePhoto: (photo: SelectedPhoto) => void;
  onClose: () => void;
}) {
  if (!photo) {
    return (
      <Modal visible={false} transparent animationType="fade" onRequestClose={onClose}>
        <View />
      </Modal>
    );
  }

  const current = photo.photos[photo.index] ?? photo;
  const canMove = photo.photos.length > 1;
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const pinchDistance = useRef<number | null>(null);
  const pinchZoom = useRef(1);
  const dragStart = useRef<{ pageX: number; pageY: number; panX: number; panY: number } | null>(null);
  const minZoom = 1;
  const maxZoom = 4;

  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    pinchDistance.current = null;
    pinchZoom.current = 1;
    dragStart.current = null;
  }, [current.key]);

  const clampZoom = (value: number) => Math.min(maxZoom, Math.max(minZoom, value));
  const applyZoom = (value: number) => {
    const nextZoom = clampZoom(value);

    setZoom(nextZoom);

    if (nextZoom === 1) {
      setPan({ x: 0, y: 0 });
    }
  };
  const changeZoom = (step: number) => setZoom((value) => {
    const nextZoom = clampZoom(value + step);

    if (nextZoom === 1) {
      setPan({ x: 0, y: 0 });
    }

    return nextZoom;
  });
  const resetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };
  const movePhoto = (step: number) => {
    const nextIndex = (photo.index + step + photo.photos.length) % photo.photos.length;
    onChangePhoto(getSelectedPhoto(photo.photos, nextIndex));
  };
  const getTouchDistance = (event: any) => {
    const touches = event.nativeEvent.touches;

    if (!touches || touches.length < 2) {
      return null;
    }

    const [first, second] = touches;
    return Math.hypot(second.pageX - first.pageX, second.pageY - first.pageY);
  };
  const handleTouchStart = (event: any) => {
    const touches = event.nativeEvent.touches;
    const distance = getTouchDistance(event);

    if (distance) {
      pinchDistance.current = distance;
      pinchZoom.current = zoom;
      dragStart.current = null;
      return;
    }

    if (zoom > 1 && touches?.length === 1) {
      dragStart.current = {
        pageX: touches[0].pageX,
        pageY: touches[0].pageY,
        panX: pan.x,
        panY: pan.y
      };
    }
  };
  const handleTouchMove = (event: any) => {
    const touches = event.nativeEvent.touches;
    const distance = getTouchDistance(event);

    if (distance && pinchDistance.current) {
      applyZoom(pinchZoom.current * (distance / pinchDistance.current));
      return;
    }

    if (zoom > 1 && touches?.length === 1 && dragStart.current) {
      setPan({
        x: dragStart.current.panX + touches[0].pageX - dragStart.current.pageX,
        y: dragStart.current.panY + touches[0].pageY - dragStart.current.pageY
      });
    }
  };
  const handleTouchEnd = () => {
    pinchDistance.current = null;
    pinchZoom.current = zoom;
    dragStart.current = null;
  };
  const webWheelProps = {
    onWheel: (event: any) => {
      event.preventDefault();
      changeZoom(event.deltaY < 0 ? 0.18 : -0.18);
    },
    onMouseDown: (event: any) => {
      if (zoom <= 1) {
        return;
      }

      dragStart.current = {
        pageX: event.pageX,
        pageY: event.pageY,
        panX: pan.x,
        panY: pan.y
      };
    },
    onMouseMove: (event: any) => {
      if (zoom <= 1 || !dragStart.current) {
        return;
      }

      setPan({
        x: dragStart.current.panX + event.pageX - dragStart.current.pageX,
        y: dragStart.current.panY + event.pageY - dragStart.current.pageY
      });
    },
    onMouseUp: () => {
      dragStart.current = null;
    },
    onMouseLeave: () => {
      dragStart.current = null;
    }
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modal}>
        <Pressable style={styles.modalCloseArea} onPress={onClose} />
        <View style={styles.modalContent}>
          <View
            {...webWheelProps}
            style={styles.modalImageStage}
            onResponderGrant={handleTouchStart}
            onResponderMove={handleTouchMove}
            onResponderRelease={handleTouchEnd}
            onResponderTerminate={handleTouchEnd}
            onStartShouldSetResponder={() => true}
            onStartShouldSetResponderCapture={() => true}
            onMoveShouldSetResponder={() => true}
            onMoveShouldSetResponderCapture={() => true}
          >
            <Image
              source={getRequiredPhoto(current.key)}
              style={[styles.modalImage, { transform: [{ translateX: pan.x }, { translateY: pan.y }, { scale: zoom }] }]}
              resizeMode="contain"
              resizeMethod="resize"
            />
          </View>
          <View style={styles.modalFooter}>
            {current.title ? (
              <View style={styles.modalText}>
                <Text numberOfLines={2} style={styles.modalTitle}>
                  {current.title}
                </Text>
                {current.subtitle ? <Text style={styles.modalSubtitle}>{current.subtitle}</Text> : null}
              </View>
            ) : null}
            <View style={styles.viewerControls}>
              <Pressable style={[styles.viewerControlButton, !canMove && styles.viewerControlButtonDisabled]} disabled={!canMove} onPress={() => movePhoto(-1)}>
                <Text style={styles.viewerControlText}>{"\u2039"}</Text>
              </Pressable>
              <Pressable style={styles.viewerControlButton} onPress={() => changeZoom(-0.25)}>
                <Text style={styles.viewerControlText}>{"-"}</Text>
              </Pressable>
              <Pressable style={styles.zoomResetButton} onPress={resetZoom}>
                <Text style={styles.zoomResetText}>{Math.round(zoom * 100)}%</Text>
              </Pressable>
              <Pressable style={styles.viewerControlButton} onPress={() => changeZoom(0.25)}>
                <Text style={styles.viewerControlText}>{"+"}</Text>
              </Pressable>
              <Pressable style={[styles.viewerControlButton, !canMove && styles.viewerControlButtonDisabled]} disabled={!canMove} onPress={() => movePhoto(1)}>
                <Text style={styles.viewerControlText}>{"\u203A"}</Text>
              </Pressable>
              <Pressable style={styles.closeButton} onPress={onClose}>
                <Text style={styles.closeButtonText}>{"\uB2EB\uAE30"}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function MenuIcon({ active }: { active: boolean }) {
  return (
    <View style={styles.menuIcon}>
      <View style={[styles.menuIconLine, active && styles.menuIconLineActive]} />
      <View style={[styles.menuIconLine, active && styles.menuIconLineActive]} />
      <View style={[styles.menuIconLine, active && styles.menuIconLineActive]} />
    </View>
  );
}

function MenuItem({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable style={[styles.menuItem, active && styles.menuItemActive]} onPress={onPress}>
      <Text style={[styles.menuItemText, active && styles.menuItemTextActive]}>{label}</Text>
    </Pressable>
  );
}

function SegmentIconButton({
  active,
  label,
  type,
  onPress
}: {
  active: boolean;
  label: string;
  type: "grid" | "list";
  onPress: () => void;
}) {
  return (
    <Pressable accessibilityLabel={label} style={[styles.segmentButton, active && styles.segmentButtonActive]} onPress={onPress}>
      {type === "grid" ? <GridIcon active={active} /> : <ListIcon active={active} />}
    </Pressable>
  );
}

function GridIcon({ active }: { active: boolean }) {
  return (
    <View style={styles.gridIcon}>
      {[0, 1, 2, 3].map((item) => (
        <View key={item} style={[styles.gridIconCell, active && styles.iconActive]} />
      ))}
    </View>
  );
}

function ListIcon({ active }: { active: boolean }) {
  return (
    <View style={styles.listIcon}>
      {[0, 1, 2].map((item) => (
        <View key={item} style={styles.listIconRow}>
          <View style={[styles.listIconDot, active && styles.iconActive]} />
          <View style={[styles.listIconLine, active && styles.iconActive]} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f7f5ef",
    paddingTop: ANDROID_STATUS_BAR_HEIGHT
  },
  app: {
    flex: 1,
    marginHorizontal: "auto",
    maxWidth: 520,
    width: "100%",
    backgroundColor: "#f7f5ef"
  },
  header: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 14,
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    zIndex: 5
  },
  headerText: {
    flex: 1,
    paddingRight: 4
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
  menuButton: {
    alignItems: "center",
    backgroundColor: "#fffdf8",
    borderColor: "#d7d1c5",
    borderRadius: 8,
    borderWidth: 1,
    height: 42,
    justifyContent: "center",
    marginTop: 2,
    width: 44
  },
  menuButtonActive: {
    backgroundColor: "#2f5f53",
    borderColor: "#2f5f53"
  },
  menuIcon: {
    alignItems: "center",
    gap: 4,
    justifyContent: "center",
    width: 18
  },
  menuIconLine: {
    backgroundColor: "#405044",
    borderRadius: 2,
    height: 2,
    width: 18
  },
  menuIconLineActive: {
    backgroundColor: "#ffffff"
  },
  menuPanel: {
    backgroundColor: "#fffdf8",
    borderColor: "#d7d1c5",
    borderRadius: 8,
    borderWidth: 1,
    elevation: 8,
    minWidth: 148,
    padding: 6,
    position: "absolute",
    right: 20,
    shadowColor: "#1e271f",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    top: 66,
    zIndex: 10
  },
  menuItem: {
    alignItems: "center",
    borderRadius: 7,
    minHeight: 38,
    justifyContent: "center",
    paddingHorizontal: 14
  },
  menuItemActive: {
    backgroundColor: "#2f5f53"
  },
  menuItemText: {
    color: "#405044",
    fontSize: 14,
    fontWeight: "700"
  },
  menuItemTextActive: {
    color: "#ffffff"
  },
  scrollContent: {
    padding: 18,
    paddingBottom: 34
  },
  albumCover: {
    aspectRatio: 0.78,
    backgroundColor: "#1f2a22",
    borderColor: "#ffffff",
    borderRadius: 8,
    borderWidth: 10,
    elevation: 8,
    overflow: "hidden",
    shadowColor: "#1e271f",
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    width: "100%"
  },
  albumCoverImage: {
    bottom: 0,
    height: "100%",
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
    width: "100%"
  },
  albumShade: {
    backgroundColor: "rgba(12, 20, 15, 0.28)",
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0
  },
  albumLabel: {
    bottom: 0,
    left: 0,
    padding: 22,
    position: "absolute",
    right: 0
  },
  albumEyebrow: {
    color: "#f6eee0",
    fontSize: 12,
    fontWeight: "800"
  },
  albumTitle: {
    color: "#fffdf7",
    fontSize: 34,
    fontWeight: "900",
    lineHeight: 40,
    marginTop: 8
  },
  albumMeta: {
    color: "#efe5d3",
    fontSize: 14,
    fontWeight: "700",
    marginTop: 8
  },
  albumDetails: {
    alignItems: "center",
    backgroundColor: "#fffdf8",
    borderColor: "#e6ded0",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    marginTop: 18,
    paddingVertical: 14
  },
  albumStat: {
    alignItems: "center",
    flex: 1
  },
  albumStatValue: {
    color: "#223129",
    fontSize: 22,
    fontWeight: "900"
  },
  albumStatLabel: {
    color: "#7b7468",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 4
  },
  albumStatDivider: {
    backgroundColor: "#e5dccd",
    height: 34,
    width: 1
  },
  screen: {
    flex: 1
  },
  segment: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 8,
    paddingTop: 2
  },
  segmentButton: {
    alignItems: "center",
    borderColor: "#d7d1c5",
    borderRadius: 8,
    borderWidth: 1,
    height: 38,
    justifyContent: "center",
    width: 54
  },
  segmentButtonActive: {
    backgroundColor: "#dfe8dc",
    borderColor: "#8fa38c"
  },
  iconActive: {
    backgroundColor: "#20382f"
  },
  gridIcon: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 3,
    height: 17,
    width: 17
  },
  gridIconCell: {
    backgroundColor: "#526155",
    borderRadius: 2,
    height: 7,
    width: 7
  },
  listIcon: {
    gap: 4,
    width: 22
  },
  listIconRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4
  },
  listIconDot: {
    backgroundColor: "#526155",
    borderRadius: 2,
    height: 4,
    width: 4
  },
  listIconLine: {
    backgroundColor: "#526155",
    borderRadius: 2,
    height: 3,
    width: 14
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
  noImage: {
    alignItems: "center",
    backgroundColor: "#efeae0",
    height: "100%",
    justifyContent: "center",
    width: "100%"
  },
  noImageText: {
    color: "#7b7468",
    fontSize: 14,
    fontWeight: "800"
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
    padding: 14
  },
  modalCloseArea: {
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0
  },
  modalContent: {
    flex: 1,
    width: "100%"
  },
  modalImageStage: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    overflow: "hidden",
    width: "100%"
  },
  modalImage: {
    height: "100%",
    width: "100%"
  },
  viewerControls: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
    marginTop: 16,
    width: "100%"
  },
  viewerControlButton: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 8,
    height: 42,
    justifyContent: "center",
    width: 44
  },
  viewerControlButtonDisabled: {
    opacity: 0.35
  },
  viewerControlText: {
    color: "#263126",
    fontSize: 24,
    fontWeight: "900",
    lineHeight: 28
  },
  zoomResetButton: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 8,
    height: 42,
    justifyContent: "center",
    minWidth: 68,
    paddingHorizontal: 10
  },
  zoomResetText: {
    color: "#263126",
    fontSize: 13,
    fontWeight: "900"
  },
  modalFooter: {
    alignItems: "center",
    paddingBottom: 10,
    paddingTop: 12
  },
  modalText: {
    alignItems: "center",
    paddingHorizontal: 12
  },
  modalTitle: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center"
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
    width: 96
  },
  closeButtonText: {
    color: "#263126",
    fontSize: 14,
    fontWeight: "800"
  }
});
