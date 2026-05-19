-- ============================================
-- IMPORTAR CLIENTES DESDE CSV — 111 registros
-- Generado: 2026-05-19T00:50:48.396Z
-- ============================================

-- 1. Tabla customers
CREATE TABLE IF NOT EXISTS customers (
    id          BIGSERIAL PRIMARY KEY,
    email       VARCHAR(255) UNIQUE NOT NULL,
    full_name   VARCHAR(255),
    phone       VARCHAR(50),
    address     TEXT,
    city        VARCHAR(100),
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW(),
    source      VARCHAR(50) DEFAULT 'csv_import'
  );

CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin customers access" ON customers;
CREATE POLICY "Admin customers access" ON customers
    FOR ALL USING (
      EXISTS (
        SELECT 1 FROM auth.users
        WHERE auth.users.id = auth.uid()
          AND auth.users.raw_user_meta_data->>'role' = 'admin'
      )
    );
  ALTER POLICY "Admin customers access" ON customers TO authenticated;
  ALTER POLICY "Admin customers access" ON customers USING (auth.uid() IS NOT NULL);


-- 2. Insertar clientes

-- Batch 1 (clientes 1-50)
INSERT INTO customers (email, full_name, phone, address, city, source) VALUES
    ('dra.ceciliaruiz@hotmail.com', NULL, '3815340014', 'barrio alto verde 2 mza K lote 27', 'yerba buena', NOW()),
    ('cintyalabrujita091@gmail.com', NULL, '3885045130', 'Catamontaña y Batalla de Quera', 'San Salvador de Jujuy', NOW()),
    ('armengolyanina2018@gmail.com', NULL, '3794022929', 'Barrio universitario Agustín maza 5255', 'Corrientes', NOW()),
    ('mivana580@gmail.com', NULL, '3878613727', 'Necochea 3216', 'Rosario', NOW()),
    ('chettocarla@gmail.com', NULL, '1170541641', 'Bragado 6290', 'Wilde', NOW()),
    ('thiagoponce427@gmail.com', NULL, '2920407913', '18 de septiembre 1287', 'Rio Colorado', NOW()),
    ('gabivrojo@gmail.com', NULL, '1164104033', 'General pinto 3870', 'Lanus', NOW()),
    ('adrianasoledadguzman08@gmail.com', NULL, '3854983817', 'Manzana 104 lote 25 barrio 25 de mayo ', 'La banda ', NOW()),
    ('mcl.66@hotmail.com', NULL, '+543416167672', 'Vuelta de obligado 4781', 'Rosario', NOW()),
    ('lucianaelianav05@gmail.com', NULL, '2995576262', 'Barrio mosconi grupo 6 duplex 123', 'Plaza Huincul', NOW()),
    ('luisruizdiaz6116@gmail.com', NULL, '1127772880', 'Conzejal Gomez 4575', 'Gregorio de Laferrere', NOW()),
    ('djfernix+1000@gmail.com', NULL, '3765016298', 'corrientes 3973 pb', 'San Salvador de Jujuy', NOW()),
    ('djfernix+900@gmail.com', NULL, '3765016299', 'aguado9875', 'San Salvador de Jujuy', NOW()),
    ('djfernix+700@gmail.com', NULL, '3765016293', 'Lopez y Planes 7450', 'San Salvador de Jujuy', NOW()),
    ('test_user_passwd_1773984001068@example.com', NULL, NULL, NULL, NULL, NOW()),
    ('djfernix+600@gmail.com', NULL, '3765016293', 'av internacional 280', 'San Salvador de Jujuy', NOW()),
    ('djfernix+500@gmail.com', NULL, '03765016293', 'av internacional 280', 'San Salvador de Jujuy', NOW()),
    ('nicanorbenicio@yahoo.com.ar', NULL, NULL, NULL, NULL, NOW()),
    ('eugeniagissellebonanni60@gmail.com', NULL, NULL, NULL, NULL, NOW()),
    ('tromina279@gmail.com', NULL, NULL, NULL, NULL, NOW()),
    ('burgosmelinamarina7@gmail.com', NULL, NULL, NULL, NULL, NOW()),
    ('madegiordano4@gmail.com', NULL, NULL, NULL, NULL, NOW()),
    ('sandracaseres1972@gmail.com', NULL, NULL, NULL, NULL, NOW()),
    ('yaniochoa045@gmail.com', NULL, NULL, NULL, NULL, NOW()),
    ('priscilalonghi32@gmail.com', NULL, NULL, NULL, NULL, NOW()),
    ('gonzalesmauro27@gmail.com', NULL, NULL, NULL, NULL, NOW()),
    ('carocandas@gmail.com', NULL, NULL, NULL, NULL, NOW()),
    ('valeriatolosa82@gmail.com', NULL, NULL, NULL, NULL, NOW()),
    ('nietosolana239@gmail.com', NULL, NULL, NULL, NULL, NOW()),
    ('gabrielvaldiviezo@hotmail.com', NULL, NULL, NULL, NULL, NOW()),
    ('anipsilva14@gmail.com', NULL, NULL, NULL, NULL, NOW()),
    ('aquinoclaudia122@gmail.com', NULL, NULL, NULL, NULL, NOW()),
    ('jl_electricidad@outlook.com', NULL, NULL, NULL, NULL, NOW()),
    ('natymaria29@gmail.com', NULL, NULL, NULL, NULL, NOW()),
    ('yanii.alcaraz@gmail.com', NULL, NULL, NULL, NULL, NOW()),
    ('alanenriquesegu@gmail.com', NULL, NULL, NULL, NULL, NOW()),
    ('davidlopezalicia@gmail.com', NULL, NULL, NULL, NULL, NOW()),
    ('bordonveronica807@gmail.com', NULL, NULL, 'Barrio Solis Pizarro Ampliacion el ñandu 1819', 'Salta Capital', NOW()),
    ('anapm9977@gmail.com', NULL, NULL, NULL, NULL, NOW()),
    ('compras@magicpark.com.ar', NULL, NULL, NULL, NULL, NOW()),
    ('miaconstanza0507@gmail.com', NULL, NULL, NULL, NULL, NOW()),
    ('mariaveronicaartaza48@gmail.com', NULL, NULL, NULL, NULL, NOW()),
    ('camilavercellino@gmail.com', NULL, NULL, NULL, NULL, NOW()),
    ('horacioqwe238@gmail.com', NULL, NULL, NULL, NULL, NOW()),
    ('clauvggonzalez@gmail.com', NULL, NULL, NULL, NULL, NOW()),
    ('gabrielagranita@gmail.com', NULL, NULL, NULL, NULL, NOW()),
    ('majoq56@gmail.com', NULL, NULL, 'Manzana 3 lote 23', 'San Salvador de Jujuy', NOW()),
    ('agustinahuertas307@gmail.com', NULL, NULL, NULL, NULL, NOW()),
    ('johanandrada045@gmail.com', NULL, NULL, NULL, NULL, NOW()),
    ('iburgos.ib11@gmail.com', NULL, NULL, NULL, NULL, NOW())
ON CONFLICT (email) DO UPDATE SET
      email      = EXCLUDED.email,
      full_name  = EXCLUDED.full_name,
      phone      = EXCLUDED.phone,
      address    = EXCLUDED.address,
      city       = EXCLUDED.city,
      source     = EXCLUDED.source,
      updated_at = NOW();

-- Batch 2 (clientes 51-100)
INSERT INTO customers (email, full_name, phone, address, city, source) VALUES
    ('vivetuvidaalmaximo31@gmail.com', NULL, NULL, NULL, NULL, NOW()),
    ('tamaraluzp501@gmail.com', NULL, NULL, NULL, NULL, NOW()),
    ('tatianna9802@gmail.com', NULL, NULL, NULL, NULL, NOW()),
    ('yacoraitemateriales@gmail.com', NULL, NULL, NULL, NULL, NOW()),
    ('marcelosolis2002@hotmail.com', NULL, NULL, NULL, NULL, NOW()),
    ('luciana.ruth95@gmail.com', NULL, NULL, NULL, NULL, NOW()),
    ('arceluciana30@gmail.com', NULL, NULL, NULL, NULL, NOW()),
    ('silvana16mayo@gmail.com', NULL, NULL, NULL, NULL, NOW()),
    ('msol.fcar@hotmail.com', NULL, NULL, NULL, NULL, NOW()),
    ('nose@gmail.com', NULL, NULL, NULL, NULL, NOW()),
    ('tierradejujuy2@gmail.com', NULL, NULL, NULL, NULL, NOW()),
    ('miriam_crespo_1@hotmail.com', NULL, NULL, NULL, NULL, NOW()),
    ('veran9551@gmail.com', NULL, NULL, NULL, NULL, NOW()),
    ('rocio_martin76@hotmail.com', NULL, NULL, NULL, NULL, NOW()),
    ('celestezerpa123@gmail.com', NULL, NULL, NULL, NULL, NOW()),
    ('ezekielpunk1991@gmail.com', NULL, NULL, NULL, NULL, NOW()),
    ('danajerez3086@gmail.com', NULL, NULL, NULL, NULL, NOW()),
    ('rubenquiroz250964@gmail.com', NULL, NULL, NULL, NULL, NOW()),
    ('maricristinachizo@gmail.com', NULL, NULL, NULL, NULL, NOW()),
    ('djfernix+2000@gmail.com', NULL, NULL, NULL, NULL, NOW()),
    ('admin@magnolia.com', NULL, NULL, NULL, NULL, NOW()),
    ('lupiluciara@gmail.com', NULL, NULL, NULL, NULL, NOW()),
    ('leolamareamellama@gmail.com', NULL, NULL, NULL, NULL, NOW()),
    ('nutrijorgelinaguado@gmail.com', NULL, NULL, NULL, NULL, NOW()),
    ('djfernix+134@gmail.com', NULL, NULL, NULL, NULL, NOW()),
    ('magnolianoved56@gmail.com', NULL, NULL, NULL, NULL, NOW()),
    ('carinabordon03@gmail.com', NULL, NULL, NULL, NULL, NOW()),
    ('lrnsclr30@gmail.com', NULL, NULL, NULL, NULL, NOW()),
    ('fran.ramirez18022@gmail.com', NULL, NULL, NULL, NULL, NOW()),
    ('mercy1900@hotmail.com', NULL, NULL, NULL, NULL, NOW()),
    ('nuevocomienzo776@gmail.com', NULL, NULL, NULL, NULL, NOW()),
    ('grace_250907@hotmail.com', NULL, NULL, NULL, NULL, NOW()),
    ('rosanagonzales414@gmail.com', NULL, NULL, NULL, NULL, NOW()),
    ('zintgraffsusana@gmail.com', NULL, NULL, NULL, NULL, NOW()),
    ('georginaadaalicia@gmail.com', NULL, NULL, NULL, NULL, NOW()),
    ('gonlu563@gmail.com', NULL, NULL, NULL, NULL, NOW()),
    ('ortunoandrea7@gmail.com', NULL, NULL, NULL, NULL, NOW()),
    ('maydorado92@gmail.com', NULL, NULL, NULL, NULL, NOW()),
    ('maxifpb@gmail.com', NULL, NULL, NULL, NULL, NOW()),
    ('vikialvarado2@gmail.com', NULL, NULL, NULL, NULL, NOW()),
    ('djfernix+10@gmail.com', NULL, NULL, NULL, NULL, NOW()),
    ('fmartinezalvarado404@gmail.com', NULL, NULL, NULL, NULL, NOW()),
    ('matiasq56@gmail.com', NULL, NULL, 'Toquero', 'San Salvador de Jujuy', NOW()),
    ('djfernix+2@gmail.com', NULL, NULL, NULL, NULL, NOW()),
    ('cely9007@gmail.com', NULL, '1172285323', 'LIBERTAD 121', 'CABA', NOW()),
    ('celi9007@gmail.com', NULL, NULL, NULL, NULL, NOW()),
    ('mauriciofernandobettiol@gmail.com', NULL, NULL, NULL, NULL, NOW()),
    ('fernandomauriciobettiol@gmail.com', NULL, NULL, NULL, NULL, NOW()),
    ('djfernix@gmail.com', NULL, '3765016293', 'av internacional  280', 'San Salvador de Jujuy', NOW()),
    ('administracion@magnolia.com', NULL, '01165793538', 'Lopez y Planes 7450', 'San Salvador de Jujuy', NOW())
ON CONFLICT (email) DO UPDATE SET
      email      = EXCLUDED.email,
      full_name  = EXCLUDED.full_name,
      phone      = EXCLUDED.phone,
      address    = EXCLUDED.address,
      city       = EXCLUDED.city,
      source     = EXCLUDED.source,
      updated_at = NOW();

-- Batch 3 (clientes 101-111)
INSERT INTO customers (email, full_name, phone, address, city, source) VALUES
    ('camic45@gmail.com', NULL, '388556663', 'Lima 567', 'Caba', NOW()),
    ('dani34@gmail.com', NULL, '113528559', 'Lima 345', 'Caba', NOW()),
    ('djfernix+057@gmail.com', NULL, '3765016295', 'aguado9875', 'San Salvador de Jujuy', NOW()),
    ('djfernix+800@gmail.com', NULL, '3765016294', 'Lopez y Planes 7450', 'San Salvador de Jujuy', NOW()),
    ('johanaflores2509@gmail.com', NULL, '2966355589', 'Avenida gendarmeria mza 163A Casa 17', 'Río Turbio ', NOW()),
    ('marihg@gmail.com', NULL, '3885555425', 'Libertad 34', 'Caba', NOW()),
    ('mio-luxo@gmail.com', NULL, '388566231', 'Toquero 735', 'San Salvador de Jujuy', NOW()),
    ('mio-mattq@gmail.com', NULL, '3885654123', 'Toquero 750', 'Caba', NOW()),
    ('noriegasonia34@gmail.com', NULL, '2995284559', 'Hugo rimmele 3900', 'Cipolletti ', NOW()),
    ('romy3jorgi@hotmail.com.ar', NULL, '2995347934', 'Barrio adus3 calle 22', 'Rincon de los sauces ', NOW()),
    ('roxanadruck@gmail.com', NULL, '02325592974', 'Calle 503  nro. 1358', 'San Andres De Giles', NOW())
ON CONFLICT (email) DO UPDATE SET
      email      = EXCLUDED.email,
      full_name  = EXCLUDED.full_name,
      phone      = EXCLUDED.phone,
      address    = EXCLUDED.address,
      city       = EXCLUDED.city,
      source     = EXCLUDED.source,
      updated_at = NOW();

-- 3. Verificación
SELECT COUNT(*) AS total_clientes FROM customers;
SELECT email, full_name, phone, address, city, created_at
FROM customers ORDER BY created_at DESC LIMIT 15;