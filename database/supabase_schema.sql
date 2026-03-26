-- Script para crear la tabla 'appointments' en PostgreSQL / Supabase
-- Ejecuta esto en el editor SQL de tu panel de Supabase

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_name VARCHAR(100) NOT NULL,
    whatsapp VARCHAR(20) NOT NULL,
    service VARCHAR(100) NOT NULL,
    appointment_date TIMESTAMP NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Opcional: Configurar políticas de seguridad RLS si el frontend se conectará directo más adelante
-- ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
