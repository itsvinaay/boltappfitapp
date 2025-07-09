# vinayfit
# vinayfit

viral yt 
components/admin/UserManagementView.tsx
components/admin/InvitationManagementView.tsx
components/today/TodayAdminView.tsx
app/admin/user-management.tsx
app/admin/invitations.tsx
app/invite/[token].tsx
app/(tabs)/_layout.tsx
components/coaching/CoachingAdminView.tsx
app/(tabs)/coaching.tsx


components/nutrition/ClientMealView.tsx
components/nutrition/NutritionistClientListView.tsx
app/nutrition/client/[id].tsx
components/coaching/CoachingNutritionistView.tsx
app/(tabs)/coaching.tsx


components/profile/ProfileClientView.tsx
components/profile/ProfileTrainerView.tsx
components/profile/ProfileNutritionistView.tsx
components/profile/ProfileAdminView.tsx
components/profile/ProfileHRView.tsx
app/(tabs)/profile.tsx


Client Assignment Management System

Undo

components/admin/ClientAssignmentView.tsx
app/admin/client-assignments.tsx
components/admin/AssignmentOverviewView.tsx
components/today/TodayAdminView.tsx
components/today/TodayHRView.tsx
components/coaching/CoachingAdminView.tsx# vinayfit-app
# vinay.fit-tsx
# vinay.fit-Pro
# boltapp
"# boltappfitapp" 


Important Note on Supabase Storage Setup:
For the image upload to work, you must have a Supabase Storage bucket named thumbnails and appropriate RLS policies. Here's an example of basic RLS policies you might need for testing (adjust for production security):


-- In your Supabase SQL Editor:

-- Create the bucket if it doesn't exist (optional, can do via UI)
INSERT INTO storage.buckets (id, name, public)
VALUES ('thumbnails', 'thumbnails', true) -- Set to true for public access to uploaded images
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects table (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to upload files to 'thumbnails' bucket
CREATE POLICY "Allow authenticated uploads to thumbnails"
  ON storage.objects FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'thumbnails'
  );

-- Policy for authenticated users to view files in 'thumbnails' bucket
CREATE POLICY "Allow authenticated reads from thumbnails"
  ON storage.objects FOR SELECT TO authenticated USING (
    bucket_id = 'thumbnails'
  );

-- Policy for authenticated users to update/upsert files in 'thumbnails' bucket
CREATE POLICY "Allow authenticated updates to thumbnails"
  ON storage.objects FOR UPDATE TO authenticated USING (
    bucket_id = 'thumbnails'
  );
