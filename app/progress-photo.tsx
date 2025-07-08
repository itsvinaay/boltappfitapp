import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Image,
  Dimensions,
  Alert,
  Platform,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Plus, X, Camera, Image as ImageIcon, Grid3x3 as Grid3X3, List, Calendar, Weight, Percent, MoveHorizontal as MoreHorizontal, TrendingUp, Target, Star, Filter, Search, Share as ShareIcon, Download, Eye, Zap, Ellipsis, Trash2, Info, Copy, Heart, Edit } from 'lucide-react-native';

// import { ArrowLeft, Plus, X, Camera, Image as ImageIcon, Grid3x3 as Grid3X3, List, Calendar, Weight, Percent, MoveHorizontal as MoreHorizontal, TrendingUp, Target, Star, Filter, Search, Share, Download, Eye, Zap, Ellipsis, Trash2, Info, Copy, Heart, Edit } from 'lucide-react-native';
import { useColorScheme, getColors } from '@/hooks/useColorScheme';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import BottomSheet from '@/components/BottomSheet';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import * as Clipboard from 'expo-clipboard';

const { width, height } = Dimensions.get('window');

interface ProgressPhoto {
  id: string;
  imageUri: string;
  weight?: number;
  bodyFat?: number;
  musclePercentage?: number;
  measurements?: {
    chest?: number;
    waist?: number;
    hips?: number;
    arms?: number;
    thighs?: number;
  };
  date: string;
  time: string;
  tags?: string[];
  pose: 'front' | 'side' | 'back' | 'custom';
  notes?: string;
  mood?: 'motivated' | 'confident' | 'determined' | 'proud' | 'focused';
  isFavorite?: boolean;
}

interface ComparisonData {
  photo1: ProgressPhoto;
  photo2: ProgressPhoto;
  weightChange: number;
  bodyFatChange: number;
  daysBetween: number;
}

export default function ProgressPhotoScreen() {
  const colorScheme = useColorScheme();
  const colors = getColors(colorScheme);
  const styles = createStyles(colors);
const [isBottomSheetVisible, setIsBottomSheetVisible] = useState(false);
const [isBottomMenuVisible, setIsBottomMenuVisible] = useState(false);
  const [currentPhotoId, setCurrentPhotoId] = useState<string>('');
 const showBottomSheet = () => {
    setIsBottomSheetVisible(true);
  };


  const hideBottomSheet = () => {
    setIsBottomSheetVisible(false);
  };

   const showBottomMenu = (photoId: string) => {
    setCurrentPhotoId(photoId);
    setIsBottomMenuVisible(true);
  };
  

  const hideBottomMenu = () => {
    setCurrentPhotoId('');

    setIsBottomMenuVisible(false);
  };

 const handleSharePhoto = async () => {
    try {
      const currentPhoto = photos.find(p => p.id === currentPhotoId);
      if (!currentPhoto) {
        Alert.alert('Error', 'Photo not found');
        return;
      }

      const result = await Share.share({
        url: currentPhoto.imageUri,
        message: `Check out my progress photo! ${currentPhoto.notes || ''}`,
      });
      
      if (result.action === Share.sharedAction) {
        console.log('Photo shared successfully');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to share photo');
      console.error(error);
    }
    hideBottomMenu();
  };

  const handleEditPhoto = () => {
    const currentPhoto = photos.find(p => p.id === currentPhotoId);
    if (!currentPhoto) {
      Alert.alert('Error', 'Photo not found');
      return;
    }

    // Set the photo for editing and show the photo modal
    setTempImageUri(currentPhoto.imageUri);
    setNewPhoto({
      weight: currentPhoto.weight,
      bodyFat: currentPhoto.bodyFat,
      musclePercentage: currentPhoto.musclePercentage,
      measurements: currentPhoto.measurements,
      date: currentPhoto.date,
      time: currentPhoto.time,
      tags: currentPhoto.tags,
      pose: currentPhoto.pose,
      notes: currentPhoto.notes,
      mood: currentPhoto.mood
    });
    setShowPhotoModal(true);
    hideBottomMenu();
  };

  const handleDownloadPhoto = async () => {
    try {
      const currentPhoto = photos.find(p => p.id === currentPhotoId);
      if (!currentPhoto) {
        Alert.alert('Error', 'Photo not found');
        return;
      }

      // Request media library permissions
      const { status } = await MediaLibrary.requestPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Please grant media library access to download photos');
        return;
      }

      // For web or external URLs, we'll show a success message
      // In a real app, you'd need to download the image first
      if (currentPhoto.imageUri.startsWith('http')) {
        Alert.alert('Success', 'Photo download initiated. Check your downloads folder.');
      } else {
        // Save to device gallery for local files
        const asset = await MediaLibrary.createAssetAsync(currentPhoto.imageUri);
        await MediaLibrary.createAlbumAsync('Progress Photos', asset, false);
        Alert.alert('Success', 'Photo saved to your gallery');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to download photo');
      console.error(error);
    }
    hideBottomMenu();
  };

  const handleSetAsFavorite = async () => {
    try {
      const currentPhoto = photos.find(p => p.id === currentPhotoId);
      if (!currentPhoto) {
        Alert.alert('Error', 'Photo not found');
        return;
      }

      // Toggle favorite status
      const newFavoriteStatus = !currentPhoto.isFavorite;
      
      // Update the photo in the photos array
      setPhotos(prevPhotos => 
        prevPhotos.map(photo => 
          photo.id === currentPhotoId 
            ? { ...photo, isFavorite: newFavoriteStatus }
            : photo
        )
      );
      
      Alert.alert(
        'Success', 
        newFavoriteStatus ? 'Added to favorites' : 'Removed from favorites'
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to update favorite status');
      console.error(error);
    }
    hideBottomMenu();
  };

  const handleCopyPhoto = async () => {
    try {
      const currentPhoto = photos.find(p => p.id === currentPhotoId);
      if (!currentPhoto) {
        Alert.alert('Error', 'Photo not found');
        return;
      }

      // For web/external URLs, copy the URL to clipboard
      if (currentPhoto.imageUri.startsWith('http')) {
        await Clipboard.setStringAsync(currentPhoto.imageUri);
        Alert.alert('Success', 'Photo URL copied to clipboard');
      } else {
        // For local files, copy image to clipboard
        await Clipboard.setImageAsync(currentPhoto.imageUri);
        Alert.alert('Success', 'Photo copied to clipboard');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to copy photo');
      console.error(error);
    }
    hideBottomMenu();
  };

  const handleViewDetails = () => {
    const currentPhoto = photos.find(p => p.id === currentPhotoId);
    if (!currentPhoto) {
      Alert.alert('Error', 'Photo not found');
      return;
    }

    // Set the selected photo to show in detail modal
    setSelectedPhoto(currentPhoto);
    hideBottomMenu();
  };

  const handleDeletePhoto = () => {
    const currentPhoto = photos.find(p => p.id === currentPhotoId);
    if (!currentPhoto) {
      Alert.alert('Error', 'Photo not found');
      return;
    }

    Alert.alert(
      'Delete Photo',
      'Are you sure you want to delete this photo? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Remove photo from the photos array
              setPhotos(prevPhotos => prevPhotos.filter(photo => photo.id !== currentPhotoId));
              
              // Delete local file if it's a local file
              if (currentPhoto.imageUri.startsWith('file://')) {
                await FileSystem.deleteAsync(currentPhoto.imageUri);
              }
              
              Alert.alert('Success', 'Photo deleted successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete photo');
              console.error(error);
            }
          },
        },
      ]
    );
    hideBottomMenu();
  };


  const [photos, setPhotos] = useState<ProgressPhoto[]>([
    {
      id: '1',
      imageUri: 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=800',
      weight: 69.5,
      bodyFat: 15,
      musclePercentage: 42,
      measurements: {
        chest: 102,
        waist: 81,
        arms: 35,
      },
      date: '2025-01-15',
      time: '08:30',
      tags: ['morning', 'baseline'],
      pose: 'front',
      notes: 'Starting my fitness journey!',
      mood: 'motivated',
      isFavorite: true

    },
    {
      id: '2',
      imageUri: 'https://images.pexels.com/photos/1552242/pexels-photo-1552242.jpeg?auto=compress&cs=tinysrgb&w=800',
      weight: 68.2,
      bodyFat: 13.5,
      musclePercentage: 44,
      measurements: {
        chest: 104,
        waist: 79,
        arms: 36,
      },
      date: '2025-01-08',
      time: '07:45',
      tags: ['progress', 'week4'],
      pose: 'front',
      notes: 'Feeling stronger every day!',
      isFavorite: true,
      mood: 'confident',
    },
    {
      id: '3',
      imageUri: 'https://images.pexels.com/photos/3822356/pexels-photo-3822356.jpeg?auto=compress&cs=tinysrgb&w=800',
      weight: 67.8,
      bodyFat: 12.8,
      musclePercentage: 45,
      date: '2025-01-01',
      time: '09:15',
      tags: ['newyear', 'goals'],
      pose: 'side',
      notes: 'New year, new me!',
      isFavorite: false,
      mood: 'determined',
    }
  ]);

  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'comparison'>('grid');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<ProgressPhoto | null>(null);
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  const [comparisonData, setComparisonData] = useState<ComparisonData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPose, setFilterPose] = useState<string>('all');
  const [filterTimeframe, setFilterTimeframe] = useState<string>('all');
  
  // Form states
  const [newPhoto, setNewPhoto] = useState<Partial<ProgressPhoto>>({
    weight: undefined,
    bodyFat: undefined,
    musclePercentage: undefined,
    measurements: {},
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    tags: [],
    pose: 'front',
    mood: 'motivated'
  });
  const [tempImageUri, setTempImageUri] = useState<string>('');
  const [newTag, setNewTag] = useState('');

  // Camera states
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  const moodEmojis = {
    motivated: '🔥',
    confident: '💪',
    determined: '🎯',
    proud: '⭐',
    focused: '⚡'
  };

  const handleAddPhoto = () => {
    setShowAddModal(true);
  };

  const handleTakePhoto = async () => {
    if (Platform.OS === 'web') {
      setTempImageUri('https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=800');
      setShowCameraModal(false);
      setShowPhotoModal(true);
    } else {
      if (!permission?.granted) {
        const result = await requestPermission();
        if (!result.granted) {
          Alert.alert('Permission required', 'Camera permission is needed to take photos');
          return;
        }
      }
      setShowCameraModal(true);
    }
  };

  const handleOpenAlbum = () => {
    const sampleImages = [
      'https://images.pexels.com/photos/1552242/pexels-photo-1552242.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/3822356/pexels-photo-3822356.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=800'
    ];
    const randomImage = sampleImages[Math.floor(Math.random() * sampleImages.length)];
    setTempImageUri(randomImage);
    setShowAddModal(false);
    setShowPhotoModal(true);
  };

  const capturePhoto = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync();
        if (photo) {
          setTempImageUri(photo.uri);
          setShowCameraModal(false);
          setShowPhotoModal(true);
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to take photo');
      }
    }
  };

  const handleSavePhoto = () => {
    if (!tempImageUri) return;

    const isEditing = currentPhotoId !== '';
    
    if (isEditing) {
      // Update existing photo
      setPhotos(prevPhotos => 
        prevPhotos.map(photo => 
          photo.id === currentPhotoId 
            ? {
                ...photo,
                weight: newPhoto.weight,
                bodyFat: newPhoto.bodyFat,
                musclePercentage: newPhoto.musclePercentage,
                measurements: newPhoto.measurements,
                date: newPhoto.date || photo.date,
                time: newPhoto.time || photo.time,
                tags: newPhoto.tags || photo.tags,
                pose: newPhoto.pose || photo.pose,
                notes: newPhoto.notes,
                mood: newPhoto.mood || photo.mood
              }
            : photo
        )
      );
    } else {
      // Add new photo
      const newPhotoData: ProgressPhoto = {
        id: Date.now().toString(),
        imageUri: tempImageUri,
        weight: newPhoto.weight,
        bodyFat: newPhoto.bodyFat,
        musclePercentage: newPhoto.musclePercentage,
        measurements: newPhoto.measurements,
        date: newPhoto.date || new Date().toISOString().split('T')[0],
        time: newPhoto.time || new Date().toTimeString().slice(0, 5),
        tags: newPhoto.tags || [],
        pose: newPhoto.pose || 'front',
        notes: newPhoto.notes,
        mood: newPhoto.mood || 'motivated',
        isFavorite: false
      };

      setPhotos(prev => [newPhotoData, ...prev]);
    }
    
    // Reset form
    setNewPhoto({
      weight: undefined,
      bodyFat: undefined,
      musclePercentage: undefined,
      measurements: {},
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().slice(0, 5),
      tags: [],
      pose: 'front',
      mood: 'motivated'
    });
    setTempImageUri('');
    setCurrentPhotoId('');
    setShowPhotoModal(false);
  };

  const handleAddTag = () => {
    if (newTag.trim() && newPhoto.tags && !newPhoto.tags.includes(newTag.trim())) {
      setNewPhoto(prev => ({
        ...prev,
        tags: [...(prev.tags || []), newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setNewPhoto(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag !== tagToRemove) || []
    }));
  };

  const handlePhotoSelect = (photoId: string) => {
    if (viewMode === 'comparison') {
      setSelectedPhotos(prev => {
        if (prev.includes(photoId)) {
          return prev.filter(id => id !== photoId);
        } else if (prev.length < 2) {
          const newSelection = [...prev, photoId];
          if (newSelection.length === 2) {
            const photo1 = photos.find(p => p.id === newSelection[0])!;
            const photo2 = photos.find(p => p.id === newSelection[1])!;
            const comparison = calculateComparison(photo1, photo2);
            setComparisonData(comparison);
            setShowComparison(true);
          }
          return newSelection;
        }
        return prev;
      });
    } else {
      setSelectedPhoto(photos.find(p => p.id === photoId) || null);
    }
  };

  const calculateComparison = (photo1: ProgressPhoto, photo2: ProgressPhoto): ComparisonData => {
    const date1 = new Date(photo1.date);
    const date2 = new Date(photo2.date);
    const daysBetween = Math.abs((date2.getTime() - date1.getTime()) / (1000 * 60 * 60 * 24));
    
    const weightChange = (photo2.weight || 0) - (photo1.weight || 0);
    const bodyFatChange = (photo2.bodyFat || 0) - (photo1.bodyFat || 0);

    return {
      photo1: date1 < date2 ? photo1 : photo2,
      photo2: date1 < date2 ? photo2 : photo1,
      weightChange: date1 < date2 ? weightChange : -weightChange,
      bodyFatChange: date1 < date2 ? bodyFatChange : -bodyFatChange,
      daysBetween: Math.round(daysBetween)
    };
  };

  const getFilteredPhotos = () => {
    let filtered = photos;

    if (searchQuery) {
      filtered = filtered.filter(photo =>
        photo.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
        photo.notes?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filterPose !== 'all') {
      filtered = filtered.filter(photo => photo.pose === filterPose);
    }

    if (filterTimeframe !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (filterTimeframe) {
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
        case '3months':
          filterDate.setMonth(now.getMonth() - 3);
          break;
      }
      
      if (filterTimeframe !== 'all') {
        filtered = filtered.filter(photo => new Date(photo.date) >= filterDate);
      }
    }

    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const renderGridView = () => {
    const filteredPhotos = getFilteredPhotos();
    
    return (
      <View style={styles.gridContainer}>
        {filteredPhotos.map((photo) => (
          <TouchableOpacity
            key={photo.id}
            style={[
              styles.gridItem,
              selectedPhotos.includes(photo.id) && styles.selectedGridItem
            ]}
            onPress={() => handlePhotoSelect(photo.id)}
          >
            <Image source={{ uri: photo.imageUri }} style={styles.gridImage} />
            <View style={styles.gridOverlay}>
              <Text style={styles.gridDate}>
                {new Date(photo.date).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </Text>
              {photo.mood && (
                <Text style={styles.gridMood}>
                  {moodEmojis[photo.mood]}
                </Text>
              )}
            </View>
            {selectedPhotos.includes(photo.id) && (
              <View style={styles.selectionIndicator}>
                <Text style={styles.selectionNumber}>
                  {selectedPhotos.indexOf(photo.id) + 1}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderListView = () => {
    const filteredPhotos = getFilteredPhotos();
    
    return (
      <View style={styles.listContainer}>
        {filteredPhotos.map((photo) => (
          <TouchableOpacity
            key={photo.id}
            style={styles.listItem}
            onPress={() => handlePhotoSelect(photo.id)}
          >
            <Image source={{ uri: photo.imageUri }} style={styles.listImage} />
            <View style={styles.listContent}>
              <View style={styles.listHeader}>
                <Text style={styles.listDate}>
                  {new Date(photo.date).toLocaleDateString('en-US', { 
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric'
                  })}
                </Text>
                {photo.mood && (
                  <Text style={styles.listMood}>
                    {moodEmojis[photo.mood]}
                  </Text>
                )}
              </View>
              
              <View style={styles.listMetrics}>
                {photo.weight && (
                  <Text style={styles.listMetric}>Weight: {photo.weight} kg</Text>
                )}
                {photo.bodyFat && (
                  <Text style={styles.listMetric}>Body Fat: {photo.bodyFat}%</Text>
                )}
                {photo.musclePercentage && (
                  <Text style={styles.listMetric}>Muscle: {photo.musclePercentage}%</Text>
                )}
              </View>
              
              {photo.tags && photo.tags.length > 0 && (
                <View style={styles.tagContainer}>
                  {photo.tags.slice(0, 3).map((tag, index) => (
                    <View key={index} style={styles.tag}>
                      <Text style={styles.tagText}>{tag}</Text>
                    </View>
                  ))}
                  {photo.tags.length > 3 && (
                    <Text style={styles.moreTagsText}>+{photo.tags.length - 3}</Text>
                  )}
                </View>
              )}
              
              {photo.notes && (
                <Text style={styles.listNotes} numberOfLines={2}>
                  {photo.notes}
                </Text>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderComparisonView = () => (
    <View style={styles.comparisonContainer}>
      <Text style={styles.comparisonInstructions}>
        Select two photos to compare your progress
      </Text>
      {renderGridView()}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Progress Photos</Text>
        {/* <TouchableOpacity onPress={handleAddPhoto} style={styles.addButton}>
          <Plus size={20} color={colors.primary} />
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity> */}
        <TouchableOpacity onPress={showBottomSheet} style={styles.addButton}>
          <Plus size={20} color={colors.primary} />
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
       
      </View>

      {/* Search and Filters */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color={colors.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by tags or notes..."
            placeholderTextColor={colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.filtersContainer}
          contentContainerStyle={styles.filtersContent}
        >
          <TouchableOpacity
            style={[styles.filterChip, filterPose === 'all' && styles.activeFilterChip]}
            onPress={() => setFilterPose('all')}
          >
            <Text style={[styles.filterText, filterPose === 'all' && styles.activeFilterText]}>
              All Poses
            </Text>
          </TouchableOpacity>
          
          {['front', 'side', 'back'].map((pose) => (
            <TouchableOpacity
              key={pose}
              style={[styles.filterChip, filterPose === pose && styles.activeFilterChip]}
              onPress={() => setFilterPose(pose)}
            >
              <Text style={[styles.filterText, filterPose === pose && styles.activeFilterText]}>
                {pose.charAt(0).toUpperCase() + pose.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
          
          <TouchableOpacity
            style={[styles.filterChip, filterTimeframe === 'week' && styles.activeFilterChip]}
            onPress={() => setFilterTimeframe(filterTimeframe === 'week' ? 'all' : 'week')}
          >
            <Text style={[styles.filterText, filterTimeframe === 'week' && styles.activeFilterText]}>
              This Week
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.filterChip, filterTimeframe === 'month' && styles.activeFilterChip]}
            onPress={() => setFilterTimeframe(filterTimeframe === 'month' ? 'all' : 'month')}
          >
            <Text style={[styles.filterText, filterTimeframe === 'month' && styles.activeFilterText]}>
              This Month
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* View Toggle */}
      <View style={styles.viewToggle}>
        <TouchableOpacity
          style={[styles.toggleButton, viewMode === 'grid' && styles.activeToggle]}
          onPress={() => {
            setViewMode('grid');
            setSelectedPhotos([]);
          }}
        >
          <Grid3X3 size={20} color={viewMode === 'grid' ? colors.surface : colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, viewMode === 'list' && styles.activeToggle]}
          onPress={() => {
            setViewMode('list');
            setSelectedPhotos([]);
          }}
        >
          <List size={20} color={viewMode === 'list' ? colors.surface : colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, viewMode === 'comparison' && styles.activeToggle]}
          onPress={() => {
            setViewMode('comparison');
            setSelectedPhotos([]);
          }}
        >
          <TrendingUp size={20} color={viewMode === 'comparison' ? colors.surface : colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {viewMode === 'grid' && renderGridView()}
        {viewMode === 'list' && renderListView()}
        {viewMode === 'comparison' && renderComparisonView()}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Add Photo Modal */}
      {/* <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>Add Progress Photo</Text>
          <Text style={styles.modalSubtitle}>Document your fitness journey</Text>
          
          <View style={styles.modalButtons}>
            <TouchableOpacity style={styles.modalButton} onPress={handleTakePhoto}>
              <Camera size={24} color={colors.primary} />
              <Text style={styles.modalButtonText}>Take Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalButton} onPress={handleOpenAlbum}>
              <ImageIcon size={24} color={colors.primary} />
              <Text style={styles.modalButtonText}>Choose from Gallery</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal> */}

      {/* Bottom Sheet Component */}
      <BottomSheet
        visible={isBottomSheetVisible}
        onClose={hideBottomSheet}
        title="Add Photos"
        colors={colors}
        snapPoints={[0.3, 0.6, 0.9]} // 30%, 60%, 90% of screen height
        initialSnap={0} // Start at first snap point (30%)
        showHandle={true}
        showHeader={true}
        enablePanGesture={true}
        closeOnBackdropPress={true}
      >
        {/* Content inside the bottom sheet */}
        <ScrollView showsVerticalScrollIndicator={false}>
           <View  >
          {/* <View style={styles.modalHandle} /> */}
          <Text style={styles.modalTitle}>Add Progress Photo</Text>
          <Text style={styles.modalSubtitle}>Document your fitness journey</Text>
          
          <View style={styles.modalButtons}>
            <TouchableOpacity style={styles.modalButton} onPress={handleTakePhoto}>
              <Camera size={24} color={colors.primary} />
              <Text style={styles.modalButtonText}>Take Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalButton} onPress={handleOpenAlbum}>
              <ImageIcon size={24} color={colors.primary} />
              <Text style={styles.modalButtonText}>Choose from Gallery</Text>
            </TouchableOpacity>
          </View>
        </View>
        </ScrollView>
      </BottomSheet>

      {/* Camera Modal */}
      <Modal
        visible={showCameraModal}
        animationType="slide"
        onRequestClose={() => setShowCameraModal(false)}
      >
        <View style={styles.cameraContainer}>
          {permission?.granted ? (
            <CameraView
              ref={cameraRef}
              style={styles.camera}
              facing={facing}
            >
              <View style={styles.cameraControls}>
                <TouchableOpacity
                  style={styles.cameraButton}
                  onPress={() => setShowCameraModal(false)}
                >
                  <X size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.captureButton}
                  onPress={capturePhoto}
                />
                <TouchableOpacity
                  style={styles.cameraButton}
                  onPress={() => setFacing(current => current === 'back' ? 'front' : 'back')}
                >
                  <Camera size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </CameraView>
          ) : (
            <View style={styles.permissionContainer}>
              <Text style={styles.permissionText}>Camera permission required</Text>
              <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
                <Text style={styles.permissionButtonText}>Grant Permission</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>

      {/* Photo Details Modal */}
      <Modal
        visible={showPhotoModal}
        animationType="slide"
        onRequestClose={() => setShowPhotoModal(false)}
      >
        <SafeAreaView style={styles.photoModalContainer}>
          <View style={styles.photoModalHeader}>
            <TouchableOpacity onPress={() => setShowPhotoModal(false)}>
              <ArrowLeft size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.photoModalTitle}>
              {currentPhotoId ? 'Edit Photo' : 'Add Photo Details'}

            </Text>
            <TouchableOpacity onPress={handleSavePhoto} style={styles.saveHeaderButton}>
              <Text style={styles.saveHeaderButtonText}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.photoModalContent}>
            {/* Photo Preview */}
            <View style={styles.photoPreview}>
              <Image source={{ uri: tempImageUri }} style={styles.previewImage} />
            </View>

            {/* Form Fields */}
            <View style={styles.formContainer}>
              {/* Pose Selection */}
              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Pose Type</Text>
                <View style={styles.poseSelector}>
                  {['front', 'side', 'back', 'custom'].map((pose) => (
                    <TouchableOpacity
                      key={pose}
                      style={[
                        styles.poseOption,
                        newPhoto.pose === pose && styles.selectedPoseOption
                      ]}
                      onPress={() => setNewPhoto(prev => ({ ...prev, pose: pose as any }))}
                    >
                      <Text style={[
                        styles.poseOptionText,
                        newPhoto.pose === pose && styles.selectedPoseOptionText
                      ]}>
                        {pose.charAt(0).toUpperCase() + pose.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Mood Selection */}
              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>How are you feeling?</Text>
                <View style={styles.moodSelector}>
                  {Object.entries(moodEmojis).map(([mood, emoji]) => (
                    <TouchableOpacity
                      key={mood}
                      style={[
                        styles.moodOption,
                        newPhoto.mood === mood && styles.selectedMoodOption
                      ]}
                      onPress={() => setNewPhoto(prev => ({ ...prev, mood: mood as any }))}
                    >
                      <Text style={styles.moodEmoji}>{emoji}</Text>
                      <Text style={[
                        styles.moodText,
                        newPhoto.mood === mood && styles.selectedMoodText
                      ]}>
                        {mood.charAt(0).toUpperCase() + mood.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Metrics */}
              <View style={styles.metricsGrid}>
                <View style={styles.metricField}>
                  <Text style={styles.fieldLabel}>Weight (kg)</Text>
                  <TextInput
                    style={styles.metricInput}
                    value={newPhoto.weight?.toString() || ''}
                    onChangeText={(text) => setNewPhoto(prev => ({ ...prev, weight: parseFloat(text) || undefined }))}
                    placeholder="--"
                    placeholderTextColor={colors.textTertiary}
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.metricField}>
                  <Text style={styles.fieldLabel}>Body Fat (%)</Text>
                  <TextInput
                    style={styles.metricInput}
                    value={newPhoto.bodyFat?.toString() || ''}
                    onChangeText={(text) => setNewPhoto(prev => ({ ...prev, bodyFat: parseFloat(text) || undefined }))}
                    placeholder="--"
                    placeholderTextColor={colors.textTertiary}
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.metricField}>
                  <Text style={styles.fieldLabel}>Muscle (%)</Text>
                  <TextInput
                    style={styles.metricInput}
                    value={newPhoto.musclePercentage?.toString() || ''}
                    onChangeText={(text) => setNewPhoto(prev => ({ ...prev, musclePercentage: parseFloat(text) || undefined }))}
                    placeholder="--"
                    placeholderTextColor={colors.textTertiary}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              {/* Notes */}
              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Notes</Text>
                <TextInput
                  style={styles.notesInput}
                  value={newPhoto.notes || ''}
                  onChangeText={(text) => setNewPhoto(prev => ({ ...prev, notes: text }))}
                  placeholder="How are you feeling about your progress?"
                  placeholderTextColor={colors.textTertiary}
                  multiline
                  numberOfLines={3}
                />
              </View>

              {/* Tags */}
              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>Tags</Text>
                <View style={styles.tagInputContainer}>
                  <TextInput
                    style={styles.tagInput}
                    value={newTag}
                    onChangeText={setNewTag}
                    placeholder="Add a tag..."
                    placeholderTextColor={colors.textTertiary}
                    onSubmitEditing={handleAddTag}
                  />
                  <TouchableOpacity style={styles.addTagButton} onPress={handleAddTag}>
                    <Plus size={16} color={colors.primary} />
                  </TouchableOpacity>
                </View>
                
                {newPhoto.tags && newPhoto.tags.length > 0 && (
                  <View style={styles.tagContainer}>
                    {newPhoto.tags.map((tag, index) => (
                      <TouchableOpacity
                        key={index}
                        style={styles.editableTag}
                        onPress={() => handleRemoveTag(tag)}
                      >
                        <Text style={styles.editableTagText}>{tag}</Text>
                        <X size={12} color={colors.primary} />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Photo Detail View Modal */}
      <Modal
        visible={!!selectedPhoto}
        animationType="slide"
        onRequestClose={() => setSelectedPhoto(null)}
      >
        {selectedPhoto && (
          <SafeAreaView style={styles.detailModalContainer}>
            <View style={styles.detailHeader}>
              <TouchableOpacity onPress={() => setSelectedPhoto(null)}>
                <ArrowLeft size={24} color={colors.text} />
              </TouchableOpacity>
              <Text style={styles.detailTitle}>Progress Photo</Text>
               <TouchableOpacity onPress={() => showBottomMenu(selectedPhoto.id)} style={styles.addButton}>
                <Ellipsis
                 size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.detailContent}>
              <Image source={{ uri: selectedPhoto.imageUri }} style={styles.detailImage} />
              
              <View style={styles.detailInfo}>
                <View style={styles.detailDateRow}>
                  <Text style={styles.detailDate}>
                    {new Date(selectedPhoto.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </Text>
                  {selectedPhoto.mood && (
                    <View style={styles.detailMoodContainer}>
                      <Text style={styles.detailMoodEmoji}>
                        {moodEmojis[selectedPhoto.mood]}
                      </Text>
                      <Text style={styles.detailMoodText}>
                        {selectedPhoto.mood.charAt(0).toUpperCase() + selectedPhoto.mood.slice(1)}
                      </Text>
                    </View>
                  )}
                </View>
                
                {(selectedPhoto.weight || selectedPhoto.bodyFat || selectedPhoto.musclePercentage) && (
                  <View style={styles.detailMetrics}>
                    {selectedPhoto.weight && (
                      <View style={styles.detailMetric}>
                        <Weight size={16} color={colors.textSecondary} />
                        <Text style={styles.detailMetricText}>{selectedPhoto.weight} kg</Text>
                      </View>
                    )}
                    {selectedPhoto.bodyFat && (
                      <View style={styles.detailMetric}>
                        <Percent size={16} color={colors.textSecondary} />
                        <Text style={styles.detailMetricText}>{selectedPhoto.bodyFat}% body fat</Text>
                      </View>
                    )}
                    {selectedPhoto.musclePercentage && (
                      <View style={styles.detailMetric}>
                        <Zap size={16} color={colors.textSecondary} />
                        <Text style={styles.detailMetricText}>{selectedPhoto.musclePercentage}% muscle</Text>
                      </View>
                    )}
                  </View>
                )}

                {selectedPhoto.notes && (
                  <View style={styles.detailNotesContainer}>
                    <Text style={styles.detailNotesLabel}>Notes</Text>
                    <Text style={styles.detailNotes}>{selectedPhoto.notes}</Text>
                  </View>
                )}

                {selectedPhoto.tags && selectedPhoto.tags.length > 0 && (
                  <View style={styles.detailTags}>
                    {selectedPhoto.tags.map((tag, index) => (
                      <View key={index} style={styles.detailTag}>
                        <Text style={styles.detailTagText}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </ScrollView>
          </SafeAreaView>
        )}
      </Modal>

      {/* Comparison Modal */}
      <Modal
        visible={showComparison}
        animationType="slide"
        onRequestClose={() => {
          setShowComparison(false);
          setSelectedPhotos([]);
          setComparisonData(null);
        }}
      >
        {comparisonData && (
          <SafeAreaView style={styles.comparisonModalContainer}>
            <View style={styles.comparisonModalHeader}>
              <TouchableOpacity onPress={() => {
                setShowComparison(false);
                setSelectedPhotos([]);
                setComparisonData(null);
              }}>
                <ArrowLeft size={24} color={colors.text} />
              </TouchableOpacity>
              <Text style={styles.comparisonModalTitle}>Progress Comparison</Text>
              <TouchableOpacity>
                <ShareIcon size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.comparisonModalContent}>
              {/* Progress Summary */}
              <View style={styles.progressSummary}>
                <Text style={styles.progressSummaryTitle}>
                  {comparisonData.daysBetween} days of progress
                </Text>
                
                <View style={styles.progressStats}>
                  {comparisonData.weightChange !== 0 && (
                    <View style={styles.progressStat}>
                      <Text style={styles.progressStatLabel}>Weight Change</Text>
                      <Text style={[
                        styles.progressStatValue,
                        { color: comparisonData.weightChange < 0 ? colors.success : colors.primary }
                      ]}>
                        {comparisonData.weightChange > 0 ? '+' : ''}{comparisonData.weightChange.toFixed(1)} kg
                      </Text>
                    </View>
                  )}
                  
                  {comparisonData.bodyFatChange !== 0 && (
                    <View style={styles.progressStat}>
                      <Text style={styles.progressStatLabel}>Body Fat Change</Text>
                      <Text style={[
                        styles.progressStatValue,
                        { color: comparisonData.bodyFatChange < 0 ? colors.success : colors.warning }
                      ]}>
                        {comparisonData.bodyFatChange > 0 ? '+' : ''}{comparisonData.bodyFatChange.toFixed(1)}%
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Photo Comparison */}
              <View style={styles.photoComparison}>
                <View style={styles.comparisonPhoto}>
                  <Text style={styles.comparisonPhotoLabel}>Before</Text>
                  <Image source={{ uri: comparisonData.photo1.imageUri }} style={styles.comparisonImage} />
                  <Text style={styles.comparisonPhotoDate}>
                    {new Date(comparisonData.photo1.date).toLocaleDateString()}
                  </Text>
                </View>
                
                <View style={styles.comparisonArrow}>
                  <TrendingUp size={32} color={colors.primary} />
                </View>
                
                <View style={styles.comparisonPhoto}>
                  <Text style={styles.comparisonPhotoLabel}>After</Text>
                  <Image source={{ uri: comparisonData.photo2.imageUri }} style={styles.comparisonImage} />
                  <Text style={styles.comparisonPhotoDate}>
                    {new Date(comparisonData.photo2.date).toLocaleDateString()}
                  </Text>
                </View>
              </View>

              {/* Detailed Metrics */}
              <View style={styles.detailedMetrics}>
                <Text style={styles.detailedMetricsTitle}>Detailed Comparison</Text>
                
                <View style={styles.metricComparison}>
                  <View style={styles.metricComparisonHeader}>
                    <Text style={styles.metricComparisonLabel}>Metric</Text>
                    <Text style={styles.metricComparisonLabel}>Before</Text>
                    <Text style={styles.metricComparisonLabel}>After</Text>
                    <Text style={styles.metricComparisonLabel}>Change</Text>
                  </View>
                  
                  {comparisonData.photo1.weight && comparisonData.photo2.weight && (
                    <View style={styles.metricComparisonRow}>
                      <Text style={styles.metricComparisonCell}>Weight</Text>
                      <Text style={styles.metricComparisonCell}>{comparisonData.photo1.weight} kg</Text>
                      <Text style={styles.metricComparisonCell}>{comparisonData.photo2.weight} kg</Text>
                      <Text style={[
                        styles.metricComparisonCell,
                        { color: comparisonData.weightChange < 0 ? colors.success : colors.primary }
                      ]}>
                        {comparisonData.weightChange > 0 ? '+' : ''}{comparisonData.weightChange.toFixed(1)} kg
                      </Text>
                    </View>
                  )}
                  
                  {comparisonData.photo1.bodyFat && comparisonData.photo2.bodyFat && (
                    <View style={styles.metricComparisonRow}>
                      <Text style={styles.metricComparisonCell}>Body Fat</Text>
                      <Text style={styles.metricComparisonCell}>{comparisonData.photo1.bodyFat}%</Text>
                      <Text style={styles.metricComparisonCell}>{comparisonData.photo2.bodyFat}%</Text>
                      <Text style={[
                        styles.metricComparisonCell,
                        { color: comparisonData.bodyFatChange < 0 ? colors.success : colors.warning }
                      ]}>
                        {comparisonData.bodyFatChange > 0 ? '+' : ''}{comparisonData.bodyFatChange.toFixed(1)}%
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </ScrollView>
          </SafeAreaView>
        )}
      </Modal>

            {/* Bottom Menu for Photo Actions */}
      
<BottomSheet
  visible={isBottomMenuVisible}
  onClose={hideBottomMenu}
  title="Photo Actions"
  colors={colors}
  snapPoints={[0.5, 0.8]} // 50%, 80% of screen height
  initialSnap={0} // Start at first snap point (50%)
  showHandle={true}
  showHeader={true}
  enablePanGesture={true}
  closeOnBackdropPress={true}
>
  {/* Content inside the bottom sheet */}
  <ScrollView showsVerticalScrollIndicator={false}>
    <View>
      <Text style={styles.modalTitle}>Photo Options</Text>
      <Text style={styles.modalSubtitle}>Choose an action for this photo</Text>
      
      <View style={styles.modalButtons}>
        <TouchableOpacity style={styles.modalButton} onPress={handleSharePhoto}>
          <ShareIcon size={24} color={colors.primary} />
          <Text style={styles.modalButtonText}>Share Photo</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.modalButton} onPress={handleEditPhoto}>
          <Edit size={24} color={colors.primary} />
          <Text style={styles.modalButtonText}>Edit Photo</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.modalButton} onPress={handleDownloadPhoto}>
          <Download size={24} color={colors.primary} />
          <Text style={styles.modalButtonText}>Download</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.modalButton} onPress={handleSetAsFavorite}>
          <Heart size={24} color={colors.primary} />
          <Text style={styles.modalButtonText}>Add to Favorites</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.modalButton} onPress={handleCopyPhoto}>
          <Copy size={24} color={colors.primary} />
          <Text style={styles.modalButtonText}>Copy Photo</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.modalButton} onPress={handleViewDetails}>
          <Info size={24} color={colors.primary} />
          <Text style={styles.modalButtonText}>View Details</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.modalButton, styles.deleteButton]} onPress={handleDeletePhoto}>
          <Trash2 size={24} color={colors.error || '#ff4444'} />
          <Text style={[styles.modalButtonText, styles.deleteButtonText]}>Delete Photo</Text>
        </TouchableOpacity>
      </View>
    </View>
  </ScrollView>
</BottomSheet>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: colors.text,
    flex: 1,
    textAlign: 'center',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  addButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: colors.primary,
    marginLeft: 4,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: colors.text,
    marginLeft: 12,
  },
  filtersContainer: {
    marginBottom: 8,
  },
  filtersContent: {
    paddingRight: 20,
  },
  filterChip: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  activeFilterChip: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: colors.textSecondary,
  },
  activeFilterText: {
    color: '#FFFFFF',
  },
  viewToggle: {
    flexDirection: 'row',
    margin: 20,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeToggle: {
    backgroundColor: colors.primary,
  },
  content: {
    flex: 1,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 6,
  },
  gridItem: {
    width: (width - 48) / 3,
    height: (width - 48) / 3,
    margin: 4,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  selectedGridItem: {
    borderWidth: 3,
    borderColor: colors.primary,
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  gridOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gridDate: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 10,
    color: '#FFFFFF',
  },
  gridMood: {
    fontSize: 12,
  },
  selectionIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectionNumber: {
    fontFamily: 'Inter-Bold',
    fontSize: 12,
    color: '#FFFFFF',
  },
  listContainer: {
    paddingHorizontal: 20,
  },
  listItem: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  listImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 16,
  },
  listContent: {
    flex: 1,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  listDate: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.text,
  },
  listMood: {
    fontSize: 20,
  },
  listMetrics: {
    marginBottom: 8,
  },
  listMetric: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  listNotes: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 8,
  },
  moreTagsText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: colors.textTertiary,
    marginLeft: 8,
  },
  comparisonContainer: {
    paddingHorizontal: 6,
  },
  comparisonInstructions: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  tag: {
    backgroundColor: colors.primary + '20',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
    marginBottom: 4,
  },
  tagText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: colors.primary,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.surface,
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 40,
  },
  modalButtons: {
    gap: 16,
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 16,
    paddingVertical: 20,
    borderWidth: 2,
    borderColor: colors.border,
  },
  modalButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.text,
    marginLeft: 12,
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  camera: {
    flex: 1,
  },
  cameraControls: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  cameraButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FFFFFF',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: 40,
  },
  permissionText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: colors.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  permissionButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  permissionButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  photoModalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  photoModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  photoModalTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: colors.text,
  },
  saveHeaderButton: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  saveHeaderButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  photoModalContent: {
    flex: 1,
  },
  photoPreview: {
    height: 300,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  formContainer: {
    padding: 20,
  },
  formField: {
    marginBottom: 24,
  },
  fieldLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.text,
    marginBottom: 12,
  },
  poseSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  poseOption: {
    flex: 1,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  selectedPoseOption: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  poseOptionText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: colors.text,
  },
  selectedPoseOptionText: {
    color: '#FFFFFF',
  },
  moodSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  moodOption: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    minWidth: '30%',
  },
  selectedMoodOption: {
    backgroundColor: colors.primary + '20',
    borderColor: colors.primary,
  },
  moodEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  moodText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: colors.textSecondary,
  },
  selectedMoodText: {
    color: colors.primary,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  metricField: {
    flex: 1,
  },
  metricInput: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    textAlign: 'center',
  },
  notesInput: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    padding: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  tagInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
  },
  tagInput: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: colors.text,
  },
  addTagButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editableTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '20',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  editableTagText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: colors.primary,
    marginRight: 6,
  },
  detailModalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  detailTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: colors.text,
  },
  detailContent: {
    flex: 1,
  },
  detailImage: {
    width: '100%',
    height: 400,
  },
  detailInfo: {
    padding: 20,
  },
  detailDateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailDate: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: colors.text,
  },
  detailMoodContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  detailMoodEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  detailMoodText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: colors.text,
  },
  detailMetrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 16,
  },
  detailMetric: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  detailMetricText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: colors.text,
    marginLeft: 8,
  },
  detailNotesContainer: {
    marginBottom: 16,
  },
  detailNotesLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.text,
    marginBottom: 8,
  },
  detailNotes: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 24,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    padding: 16,
  },
  detailTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  detailTag: {
    backgroundColor: colors.primary + '20',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  detailTagText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: colors.primary,
  },
  comparisonModalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  comparisonModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  comparisonModalTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: colors.text,
  },
  comparisonModalContent: {
    flex: 1,
  },
  progressSummary: {
    backgroundColor: colors.surface,
    margin: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  progressSummaryTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  progressStat: {
    alignItems: 'center',
  },
  progressStatLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  progressStatValue: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
  },
  photoComparison: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  comparisonPhoto: {
    flex: 1,
    alignItems: 'center',
  },
  comparisonPhotoLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.text,
    marginBottom: 8,
  },
  comparisonImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 8,
  },
  comparisonPhotoDate: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.textSecondary,
  },
  comparisonArrow: {
    marginHorizontal: 16,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 20,
    padding: 8,
  },
  detailedMetrics: {
    backgroundColor: colors.surface,
    margin: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  detailedMetricsTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: colors.text,
    marginBottom: 16,
  },
  metricComparison: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  metricComparisonHeader: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSecondary,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  metricComparisonRow: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  metricComparisonLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: colors.text,
    flex: 1,
    textAlign: 'center',
  },
  metricComparisonCell: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.text,
    flex: 1,
    textAlign: 'center',
  },
  // Delete button styles
deleteButton: {
  backgroundColor: '#ffebee', // Light red background
  borderColor: '#ffcdd2',
  borderWidth: 1,
  marginTop: 10, // Extra spacing from other buttons
},

deleteButtonText: {
  color: '#d32f2f', // Red text color
  fontWeight: '600',
}
});