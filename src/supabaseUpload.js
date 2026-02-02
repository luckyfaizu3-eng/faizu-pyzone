import supabase from './supabaseClient';

const BUCKET_NAME = 'faizupy-storage';

// ✅ PDF Upload
export const uploadPDF = async (file) => {
  try {
    console.log('📤 Uploading PDF to Supabase...');

    const fileName = `${Date.now()}_${file.name}`;
    const filePath = `pdfs/${fileName}`;

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        contentType: 'application/pdf',
        upsert: true
      });

    if (error) {
      console.error('❌ PDF upload error:', error);
      return { success: false, error: error.message };
    }

    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    console.log('✅ PDF uploaded:', urlData.publicUrl);

    return {
      success: true,
      url: urlData.publicUrl,
      fileName: file.name
    };
  } catch (error) {
    console.error('❌ PDF upload error:', error.message);
    return { success: false, error: error.message };
  }
};

// ✅ Thumbnail Upload
export const uploadImage = async (file) => {
  try {
    console.log('📤 Uploading Thumbnail to Supabase...');

    const fileName = `${Date.now()}_${file.name}`;
    const filePath = `thumbnails/${fileName}`;

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        contentType: file.type,
        upsert: true
      });

    if (error) {
      console.error('❌ Thumbnail upload error:', error);
      return { success: false, error: error.message };
    }

    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    console.log('✅ Thumbnail uploaded:', urlData.publicUrl);

    return {
      success: true,
      url: urlData.publicUrl,
      fileName: file.name
    };
  } catch (error) {
    console.error('❌ Thumbnail upload error:', error.message);
    return { success: false, error: error.message };
  }
};