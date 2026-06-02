export async function uploadRecipeMedia(
  fileUri: string,
  resourceType: 'image' | 'video'
) {
  const formData = new FormData();
  
  // React Native FormData expects an object with uri, type, and name for files
  const filename = fileUri.split('/').pop() || 'upload';
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `${resourceType}/${match[1]}` : `${resourceType}/any`;

  formData.append('file', {
    uri: fileUri,
    name: filename,
    type,
  } as any);

  formData.append('upload_preset', 'chowbase_recipes');
  formData.append('resource_type', resourceType);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`,
    {
      method: 'POST',
      body: formData,
    }
  );

  if (!res.ok) {
    throw new Error('Failed to upload to Cloudinary');
  }

  return res.json();
}
