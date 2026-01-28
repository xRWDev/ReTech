-- Adjust stock counts for a list of items (used by checkout and cancellations)
CREATE OR REPLACE FUNCTION public.adjust_stock(items jsonb, increase boolean DEFAULT false)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item jsonb;
  v_product_id uuid;
  v_qty integer;
  v_current integer;
  v_new integer;
BEGIN
  IF items IS NULL THEN
    RETURN;
  END IF;

  FOR item IN SELECT * FROM jsonb_array_elements(items)
  LOOP
    v_product_id := NULLIF(item->>'product_id', '')::uuid;
    v_qty := GREATEST(0, COALESCE((item->>'quantity')::integer, 0));

    IF v_product_id IS NULL OR v_qty = 0 THEN
      CONTINUE;
    END IF;

    SELECT stock_count INTO v_current
    FROM public.products
    WHERE id = v_product_id;

    IF v_current IS NULL THEN
      CONTINUE;
    END IF;

    IF increase THEN
      v_new := v_current + v_qty;
    ELSE
      v_new := GREATEST(0, v_current - v_qty);
    END IF;

    UPDATE public.products
    SET stock_count = v_new,
        is_available = (v_new > 0)
    WHERE id = v_product_id;
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION public.adjust_stock(jsonb, boolean) TO authenticated;
