-- Proposal 3: Indexes
CREATE INDEX idx_cec_forms_created_at ON cecschema.cec_forms(created_at);
CREATE INDEX idx_patient_name ON cecschema.cec_forms ((patient_info->>'nom_prenom'));
CREATE INDEX idx_operator_name ON cecschema.cec_forms ((team_info->>'operateur'));

-- Proposal 2: CHECK Constraints
-- We cast to numeric to ensure it's a number and then check if it's positive.
-- The jsonb_typeof check handles cases where the field is not a number or is null.
ALTER TABLE cecschema.cec_forms
ADD CONSTRAINT check_positive_poids
CHECK (jsonb_typeof(patient_info->'poids') <> 'number' OR (patient_info->>'poids')::numeric > 0);

ALTER TABLE cecschema.cec_forms
ADD CONSTRAINT check_positive_taille
CHECK (jsonb_typeof(patient_info->'taille') <> 'number' OR (patient_info->>'taille')::numeric > 0);
