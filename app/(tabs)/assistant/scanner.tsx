import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Camera, CameraType, CameraView, useCameraPermissions } from 'expo-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { X, Lightning, LightningSlash, ArrowsClockwise } from 'phosphor-react-native';
import { useThemeColors } from '../../../constants/theme';
import { supabase } from '../../../lib/supabase';
import { useModalStore } from '../../../stores/modalStore';
import { useChatStore } from '../../../stores/chatStore';
import * as ImageManipulator from 'expo-image-manipulator';

export default function ScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [flash, setFlash] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  
  const cameraRef = useRef<CameraView>(null);
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission]);

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.bgPrimary }]}>
        <Text style={[styles.text, { color: colors.textPrimary }]}>We need your permission to show the camera</Text>
        <TouchableOpacity style={[styles.btn, { backgroundColor: colors.brand.primary }]} onPress={requestPermission}>
          <Text style={styles.btnText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const handleScan = async () => {
    if (!cameraRef.current || isScanning) return;
    
    setIsScanning(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ base64: false, quality: 0.5 });
      
      if (!photo?.uri) throw new Error("Failed to capture image.");

      const resizedPhoto = await ImageManipulator.manipulateAsync(
        photo.uri,
        [{ resize: { width: 800 } }],
        { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );
      
      // Send to Edge Function
      const { data, error } = await supabase.functions.invoke('pantry-vision', {
        body: { image_base64: resizedPhoto.base64 }
      });

      if (error) {
         let serverErrorMsg = error.message;
         
         // If it's a FunctionsHttpError, it may contain the server's JSON error response
         if (error.context && typeof error.context.json === 'function') {
           try {
             const errorData = await error.context.json();
             if (errorData?.error) serverErrorMsg = errorData.error;
           } catch (_) {}
         }
         
         if (serverErrorMsg.includes('Failed to fetch') || serverErrorMsg.includes('Network')) {
            throw new Error('Network connection issue. Please check your internet connection and try again.');
         }
         throw new Error(serverErrorMsg || 'Failed to analyze the image. Please try again.');
      }

      if (!data || !data.ingredients || data.ingredients.length === 0) {
         useModalStore.getState().showAlert({
            title: 'No Food Detected',
            message: "We couldn't clearly identify any food items. Try getting closer or improving the lighting."
         });
         return;
      }

      const foundItems = data.ingredients.join(', ');
      const prompt = `I have scanned these ingredients: ${foundItems}. What can I cook with them?`;
      const imageUri = `data:image/jpeg;base64,${resizedPhoto.base64}`;
      
      const conversationId = useChatStore.getState().createConversation(
         `Cooking with ${data.ingredients[0]}...`,
         false,
         prompt,
         imageUri
      );
      
      router.replace({
        pathname: '/assistant/chat',
        params: { conversationId }
      });

    } catch (e: any) {
      useModalStore.getState().showAlert({
        title: 'Scan Failed',
        message: e.message || 'An unexpected error occurred during scanning.'
      });
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <View style={styles.container}>
      <CameraView 
        ref={cameraRef}
        style={styles.camera} 
        facing={facing}
        enableTorch={flash}
      />
      
      <View style={[styles.overlay, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.replace('/assistant')} style={styles.iconBtn}>
            <X size={24} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setFlash(!flash)} style={styles.iconBtn}>
            {flash ? <Lightning size={24} color="#FFF" weight="fill" /> : <LightningSlash size={24} color="#FFF" />}
          </TouchableOpacity>
        </View>

        <View style={styles.viewfinderContainer}>
          <View style={[styles.bracket, styles.topLeft]} />
          <View style={[styles.bracket, styles.topRight]} />
          <View style={[styles.bracket, styles.bottomLeft]} />
          <View style={[styles.bracket, styles.bottomRight]} />
          <Text style={styles.instructionText}>Point at your Food</Text>
        </View>

        <View style={[styles.footer, { paddingBottom: insets.bottom || 32 }]}>
          <TouchableOpacity style={styles.flipBtn} onPress={toggleCameraFacing}>
            <ArrowsClockwise size={28} color="#FFF" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.captureBtn, { borderColor: colors.brand.primary }]}
            onPress={handleScan}
            disabled={isScanning}
          >
            <View style={[styles.captureBtnInner, { backgroundColor: isScanning ? colors.textMuted : colors.brand.primary }]}>
              {isScanning ? <ActivityIndicator color="#FFF" /> : null}
            </View>
          </TouchableOpacity>
          
          <View style={styles.flipBtn} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  camera: { flex: 1 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewfinderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 250,
    height: 250,
    alignSelf: 'center',
  },
  bracket: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#FFF',
  },
  topLeft: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 16 },
  topRight: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 16 },
  bottomLeft: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 16 },
  bottomRight: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 16 },
  instructionText: {
    color: '#FFF',
    fontFamily: 'Sora-SemiBold',
    fontSize: 16,
    position: 'absolute',
    bottom: -40,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  captureBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  captureBtnInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flipBtn: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontFamily: 'DM-Sans',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  btn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  btnText: {
    color: '#FFF',
    fontFamily: 'Sora-Bold',
  },
});
