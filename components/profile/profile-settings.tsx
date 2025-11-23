"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/client";
import { Upload, X } from "lucide-react";
import { ImageCropper } from "@/components/ui/image-cropper";

export function ProfileSettings({ user, userEmail }: any) {
  const [namaLengkap, setNamaLengkap] = useState(user?.nama_lengkap || "");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || "");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [uploading, setUploading] = useState(false);
  const [showCropper, setShowCropper] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user?.avatar_url) {
      setAvatarUrl(user.avatar_url);
    }
  }, [user]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5MB");
      return;
    }

    // Read file and show cropper
    const reader = new FileReader();
    reader.onloadend = () => {
      setImageToCrop(reader.result as string);
      setShowCropper(true);
    };
    reader.readAsDataURL(file);
    setError("");
    setSuccess("");

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleCropComplete = async (croppedImageBlob: Blob) => {
    setUploading(true);
    setError("");
    setSuccess("");

    try {
      const supabase = createClient();
      const fileName = `${user.id}-${Date.now()}.jpg`;
      const filePath = `avatars/${fileName}`;

      // Delete old avatar if exists
      if (avatarUrl) {
        const oldPath = avatarUrl.split("/").slice(-2).join("/");
        await supabase.storage.from("avatars").remove([oldPath]);
      }

      // Upload new avatar
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, croppedImageBlob, {
          cacheControl: "3600",
          upsert: false,
          contentType: "image/jpeg",
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(filePath);

      // Update user record
      const { error: updateError } = await supabase
        .from("users")
        .update({
          avatar_url: publicUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (updateError) throw updateError;

      setAvatarUrl(publicUrl);
      setSuccess("Profile photo updated successfully");
      setShowCropper(false);
    } catch (err: any) {
      setError(err.message || "Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!avatarUrl) return;

    setUploading(true);
    setError("");
    setSuccess("");

    try {
      const supabase = createClient();
      const filePath = avatarUrl.split("/").slice(-2).join("/");
      await supabase.storage.from("avatars").remove([filePath]);

      const { error: updateError } = await supabase
        .from("users")
        .update({
          avatar_url: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (updateError) throw updateError;

      setAvatarUrl("");
      setSuccess("Profile photo removed successfully");
    } catch (err: any) {
      setError(err.message || "Failed to remove image");
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const supabase = createClient();

      const { error: updateError } = await supabase
        .from("users")
        .update({
          nama_lengkap: namaLengkap,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (updateError) throw updateError;
      setSuccess("Profile updated successfully");
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    if (password !== passwordConfirm) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    try {
      const supabase = createClient();

      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) throw updateError;
      setSuccess("Password updated successfully");
      setPassword("");
      setPasswordConfirm("");
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
        <CardHeader>
          <CardTitle className="text-slate-900 dark:text-slate-50">Profile Photo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-4">
            <Avatar className="h-32 w-32">
              <AvatarImage src={avatarUrl} alt={namaLengkap || "User"} />
              <AvatarFallback className="text-3xl">
                {namaLengkap
                  ? namaLengkap
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)
                  : "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/*"
                className="hidden"
                id="avatar-upload"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300"
              >
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? "Uploading..." : avatarUrl ? "Change Photo" : "Upload Photo"}
              </Button>
              {avatarUrl && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleRemoveAvatar}
                  disabled={uploading}
                  className="border-red-200 dark:border-red-600 text-red-600 dark:text-red-400"
                >
                  <X className="h-4 w-4 mr-2" />
                  Remove
                </Button>
              )}
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            {success && <p className="text-green-400 text-sm">{success}</p>}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
        <CardHeader>
          <CardTitle className="text-slate-900 dark:text-slate-50">Profile Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <Label className="text-slate-700 dark:text-slate-300">Full Name</Label>
              <Input
                value={namaLengkap}
                onChange={(e) => setNamaLengkap(e.target.value)}
                className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-50"
              />
            </div>
            <div>
              <Label className="text-slate-700 dark:text-slate-300">Email</Label>
              <Input
                type="email"
                value={userEmail}
                disabled
                className="bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400"
              />
            </div>
            <div>
              <Label className="text-slate-700 dark:text-slate-300">Role</Label>
              <Input
                value={user?.role}
                disabled
                className="bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400"
              />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            {success && <p className="text-green-400 text-sm">{success}</p>}
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
        <CardHeader>
          <CardTitle className="text-slate-900 dark:text-slate-50">Change Password</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div>
              <Label className="text-slate-700 dark:text-slate-300">New Password</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-50"
              />
            </div>
            <div>
              <Label className="text-slate-700 dark:text-slate-300">Confirm Password</Label>
              <Input
                type="password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                className="bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-50"
              />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            {success && <p className="text-green-400 text-sm">{success}</p>}
            <Button
              type="submit"
              disabled={isLoading || !password}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? "Updating..." : "Update Password"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {showCropper && (
        <ImageCropper
          imageSrc={imageToCrop}
          onCropComplete={handleCropComplete}
          onClose={() => {
            setShowCropper(false);
            setImageToCrop("");
          }}
          aspect={1}
        />
      )}
    </div>
  );
}
