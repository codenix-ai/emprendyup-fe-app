import { UserProfile } from '@/lib/schemas/dashboard';

// Tipos base para fechas
export type DateTime = string;

// Enumeración para el estado del post
export type PostStatus = 'DRAFT' | 'PUBLISHED';

// Interfaz para categorías del blog
export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  createdAt: DateTime;
  updatedAt: DateTime;
}

// Interfaz para etiquetas del blog
export interface BlogTag {
  id?: string;
  name: string;
  slug: string;
  createdAt: DateTime;
  updatedAt: DateTime;
}

// Interfaz principal para posts del blog
export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  status: PostStatus;
  createdAt: DateTime;
  updatedAt: DateTime;
  publishedAt?: DateTime;
  coverImageUrl?: string;

  creator?: UserProfile;

  blogCategoryId?: string;
  blogCategory?: BlogCategory;

  tags?: BlogTag[];
  relatedPosts?: BlogPost[];
}

// Tipo para crear un nuevo post
export type CreatePostInput = {
  title: string;
  content: string;
  excerpt?: string;
  status?: PostStatus;
  blogCategoryId?: string;
  coverImageUrl?: string;
  tags?: string[];
  relatedPosts?: string[];
};

// Tipo para actualizar un post existente
export type UpdatePostInput = Partial<CreatePostInput>;

// Tipos para Shipments (Envíos)
export type ShipmentStatus =
  | 'PENDIENTE_RECOLECCION'
  | 'RECOLECTADO'
  | 'EN_TRANSITO'
  | 'EN_CENTRO_DISTRIBUCION'
  | 'EN_REPARTO'
  | 'ENTREGADO'
  | 'NO_ENTREGADO'
  | 'DEVUELTO';

export interface Shipment {
  id: string;
  orderId: string;
  provider: string;
  trackingNumber: string;
  shippingCost: number;
  totalWeight: number;
  shippedAt: DateTime;
  estimatedDeliveryAt: DateTime;
  deliveredAt?: DateTime;
  status: ShipmentStatus;
  trackingUrl?: string;
  notes?: string;
  createdAt: DateTime;
  updatedAt: DateTime;
}

export type CreateShipmentInput = {
  orderId: string;
  provider: string;
  trackingNumber: string;
  shippingCost: number;
  totalWeight: number;
  shippedAt: string;
  estimatedDeliveryAt: string;
  status: ShipmentStatus;
  trackingUrl?: string;
  notes?: string;
};

export type UpdateShipmentInput = {
  trackingNumber?: string;
  shippedAt?: string;
  status?: ShipmentStatus;
  trackingUrl?: string;
  notes?: string;
};
