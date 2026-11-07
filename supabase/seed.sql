-- LUMTERRA - Données initiales (Seed)

-- 1. Catégories
insert into public.categories (name, slug, description, icon_name, color_hex) values
('Nids-de-poule', 'nids-de-poule', 'Trous et dégradations de la chaussée.', 'Activity', '#EF4444'),
('Déchets et dépôts sauvages', 'dechets', 'Accumulation d''ordures non autorisée.', 'Trash2', '#F59E0B'),
('Inondations', 'inondations', 'Problèmes d''évacuation des eaux et crues.', 'Droplets', '#3B82F6'),
('Éclairage public', 'eclairage', 'Lampadaires défectueux ou zones sombres.', 'Lightbulb', '#FBBF24'),
('Routes endommagées', 'routes', 'Fissures, affaissements ou signalisation absente.', 'Route', '#6B7280'),
('Canalisations', 'canalisations', 'Fuites d''eau ou égouts bouchés.', 'Pipette', '#0EA5E9'),
('Espaces verts', 'espaces-verts', 'Entretien des parcs, arbres tombés.', 'TreePine', '#10B981'),
('Insalubrité', 'insalubrite', 'Problèmes d''hygiène publique.', 'ShieldAlert', '#8B5CF6'),
('Pollution', 'pollution', 'Nuisances sonores, fumées ou rejets.', 'Wind', '#064E3B'),
('Autres', 'autres', 'Tout autre problème urbain non classé.', 'MoreHorizontal', '#4B5563')
on conflict (slug) do nothing;

-- 2. Zones territoriales de test (Brazzaville)
insert into public.territorial_zones (name, type) values
('Poto-Poto', 'COMMUNE'),
('Makélékélé', 'COMMUNE'),
('Bacongo', 'COMMUNE'),
('Moungali', 'COMMUNE'),
('Ouenzé', 'COMMUNE'),
('Talangaï', 'COMMUNE'),
('Mfilou', 'COMMUNE'),
('Madibou', 'COMMUNE'),
('Djiri', 'COMMUNE');
