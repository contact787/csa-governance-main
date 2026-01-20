-- Create messages table for encrypted user-to-user communication
CREATE TABLE public.messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  content text NOT NULL, -- Will store encrypted content
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  read_at timestamp with time zone
);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Users can view messages they sent or received within their organization
CREATE POLICY "Users can view their messages" ON public.messages
FOR SELECT USING (
  auth.uid() IS NOT NULL AND
  organization_id = get_user_organization_id(auth.uid()) AND
  (sender_id = auth.uid() OR receiver_id = auth.uid())
);

-- Users can send messages to others in their organization
CREATE POLICY "Users can send messages" ON public.messages
FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL AND
  sender_id = auth.uid() AND
  organization_id = get_user_organization_id(auth.uid())
);

-- Users can update messages they received (for read_at)
CREATE POLICY "Users can mark messages as read" ON public.messages
FOR UPDATE USING (
  auth.uid() IS NOT NULL AND
  receiver_id = auth.uid()
);

-- Create index for faster queries
CREATE INDEX idx_messages_sender ON public.messages(sender_id);
CREATE INDEX idx_messages_receiver ON public.messages(receiver_id);
CREATE INDEX idx_messages_organization ON public.messages(organization_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at DESC);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;