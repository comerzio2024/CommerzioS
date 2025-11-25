export async function uploadImage(file: File): Promise<string> {
  // Get signed upload URL from server
  const uploadRes = await fetch('/api/objects/upload', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!uploadRes.ok) {
    const errorText = await uploadRes.text();
    console.error('Upload endpoint response:', uploadRes.status, errorText);
    throw new Error(`Failed to get upload URL: ${uploadRes.status}`);
  }

  const { uploadURL } = await uploadRes.json();

  // Upload file to cloud storage
  const uploadResponse = await fetch(uploadURL, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file.type,
    },
  });

  if (!uploadResponse.ok) {
    throw new Error('Failed to upload image');
  }

  // Set image ACL to public
  const setAclRes = await fetch('/api/service-images', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ imageURL: uploadURL }),
  });

  if (!setAclRes.ok) {
    throw new Error('Failed to set image ACL');
  }

  const { objectPath } = await setAclRes.json();
  return objectPath;
}
