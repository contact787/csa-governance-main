-- Fix standard-documents storage policy to scope by organization
-- Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Users can view documents in their organization" ON storage.objects;

-- Create properly scoped SELECT policy
CREATE POLICY "Users can view documents in their organization"
ON storage.objects FOR SELECT USING (
  bucket_id = 'standard-documents' AND
  (storage.foldername(name))[1] IN (
    SELECT organization_id::text FROM profiles WHERE user_id = auth.uid()
  )
);

-- Also fix INSERT policy if it exists without org check
DROP POLICY IF EXISTS "Users can upload documents in their organization" ON storage.objects;

CREATE POLICY "Users can upload documents in their organization"
ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'standard-documents' AND
  (storage.foldername(name))[1] IN (
    SELECT organization_id::text FROM profiles WHERE user_id = auth.uid()
  )
);

-- Fix DELETE policy if it exists without org check
DROP POLICY IF EXISTS "Users can delete documents in their organization" ON storage.objects;

CREATE POLICY "Users can delete documents in their organization"
ON storage.objects FOR DELETE USING (
  bucket_id = 'standard-documents' AND
  (storage.foldername(name))[1] IN (
    SELECT organization_id::text FROM profiles WHERE user_id = auth.uid()
  )
);