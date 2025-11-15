CREATE OR REPLACE FUNCTION cecschema.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_cec_forms_updated_at
BEFORE UPDATE ON cecschema.cec_forms
FOR EACH ROW
EXECUTE FUNCTION cecschema.update_updated_at_column();
