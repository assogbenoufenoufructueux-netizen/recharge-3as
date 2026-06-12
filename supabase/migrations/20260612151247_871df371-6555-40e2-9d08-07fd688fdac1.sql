
-- Roles enum
CREATE TYPE public.app_role AS ENUM ('admin', 'client');
CREATE TYPE public.tx_type AS ENUM ('recharge', 'withdrawal');
CREATE TYPE public.tx_status AS ENUM ('pending', 'validated', 'rejected');
CREATE TYPE public.payment_provider AS ENUM ('mtn_momo', 'moov_money', 'celtiis_cash', 'other');

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- User roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- has_role security-definer function
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Payment methods (agent's receiving numbers)
CREATE TABLE public.payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  provider payment_provider NOT NULL,
  agent_number TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.payment_methods TO authenticated;
GRANT ALL ON public.payment_methods TO service_role;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

-- Transactions
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type tx_type NOT NULL,
  id_1xbet TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  payment_method_id UUID REFERENCES public.payment_methods(id),
  payment_method_label TEXT NOT NULL,
  tx_id TEXT,
  proof_url TEXT,
  recipient_number TEXT,
  status tx_status NOT NULL DEFAULT 'pending',
  rejection_reason TEXT,
  validated_at TIMESTAMPTZ,
  validated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.transactions TO authenticated;
GRANT ALL ON public.transactions TO service_role;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_transactions_user ON public.transactions(user_id, created_at DESC);
CREATE INDEX idx_transactions_status ON public.transactions(status, created_at DESC);

-- Notifications
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE CASCADE,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_notifications_user ON public.notifications(user_id, created_at DESC);

-- Admin logs
CREATE TABLE public.admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id),
  action TEXT NOT NULL,
  target_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.admin_logs TO authenticated;
GRANT ALL ON public.admin_logs TO service_role;
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

-- Policies: profiles
CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Policies: user_roles
CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- Policies: payment_methods (all authenticated can read active ones; admin manages)
CREATE POLICY "Authenticated read payment methods" ON public.payment_methods FOR SELECT TO authenticated
  USING (active = true OR public.has_role(auth.uid(), 'admin'));

-- Policies: transactions
CREATE POLICY "Users read own transactions" ON public.transactions FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users insert own transactions" ON public.transactions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND status = 'pending');
CREATE POLICY "Admins update transactions" ON public.transactions FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Policies: notifications
CREATE POLICY "Users read own notifications" ON public.notifications FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Users update own notifications" ON public.notifications FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Policies: admin_logs
CREATE POLICY "Admins read logs" ON public.admin_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- updated_at trigger fn
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_payment_methods_updated BEFORE UPDATE ON public.payment_methods FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_transactions_updated BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile + assign client role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Utilisateur'),
    COALESCE(NEW.raw_user_meta_data->>'phone', NEW.id::text)
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'client');
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Notification trigger when transaction status changes
CREATE OR REPLACE FUNCTION public.notify_tx_status()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_title TEXT;
  v_msg TEXT;
  v_type TEXT;
BEGIN
  IF NEW.status = OLD.status THEN RETURN NEW; END IF;
  v_type := CASE NEW.type WHEN 'recharge' THEN 'Recharge' ELSE 'Retrait' END;
  IF NEW.status = 'validated' THEN
    v_title := v_type || ' validée';
    v_msg := 'Votre demande de ' || lower(v_type) || ' de ' || NEW.amount::TEXT || ' FCFA a été validée.';
  ELSIF NEW.status = 'rejected' THEN
    v_title := v_type || ' rejetée';
    v_msg := 'Votre demande de ' || lower(v_type) || ' a été rejetée. ' || COALESCE('Motif : ' || NEW.rejection_reason, '');
  ELSE
    RETURN NEW;
  END IF;
  INSERT INTO public.notifications (user_id, title, message, transaction_id)
  VALUES (NEW.user_id, v_title, v_msg, NEW.id);
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_notify_tx_status AFTER UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.notify_tx_status();

-- Seed payment methods
INSERT INTO public.payment_methods (name, provider, agent_number) VALUES
  ('MTN Mobile Money', 'mtn_momo', '+229 00 00 00 00'),
  ('Moov Money', 'moov_money', '+229 00 00 00 00'),
  ('Celtiis Cash', 'celtiis_cash', '+229 00 00 00 00');
