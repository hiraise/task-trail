/**
 * Command for uploading user avatar.
 * 
 * Represents the user's intent to upload a new avatar image.
 * Now consistently uses File objects for both original uploads and cropped images.
 */
export interface UploadAvatarCommand {
  avatarFile: File;
}
