
GRANT INSERT, UPDATE, DELETE ON public.payment_methods TO authenticated;

CREATE POLICY "Admins insert payment methods" ON public.payment_methods
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update payment methods" ON public.payment_methods
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete payment methods" ON public.payment_methods
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
