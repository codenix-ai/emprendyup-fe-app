'use client';
import { useMutation, useQuery } from '@apollo/client';
import { ApolloError } from '@apollo/client';
import {
  GET_WHATSAPP_SALES_AGENT_CONFIG,
  UPSERT_WHATSAPP_SALES_AGENT_CONFIG,
} from '@/lib/graphql/queries';

export interface WhatsAppSalesAgentConfig {
  id: string;
  entityType: string;
  entityId: string;
  whatsappNumber: string;
  catalogUrl: string;
  systemPrompt: string;
  promptVersion?: number | null;
  isActive: boolean;
  updatedAt?: string | null;
}

export const getWhatsAppSalesAgentErrorMessage = (error: ApolloError): string => {
  if (error.graphQLErrors.length > 0) {
    return error.graphQLErrors[0].message || 'Error en la solicitud.';
  }

  if (error.networkError) {
    return 'Error de red. Verifica tu conexión.';
  }

  return 'Ocurrió un error inesperado.';
};

export const useWhatsAppSalesAgentConfig = (entityType?: string, entityId?: string) => {
  const { data, loading, error, refetch } = useQuery(GET_WHATSAPP_SALES_AGENT_CONFIG, {
    variables: entityType && entityId ? { entityType, entityId } : undefined,
    skip: !entityType || !entityId,
    errorPolicy: 'all',
    fetchPolicy: 'cache-and-network',
  });

  const [upsertConfigMutation, { loading: saving, error: saveError }] = useMutation(
    UPSERT_WHATSAPP_SALES_AGENT_CONFIG,
    {
      errorPolicy: 'all',
    }
  );

  const upsertConfig = async (input: {
    entityType: string;
    entityId: string;
    whatsappNumber: string;
    catalogUrl: string;
    systemPrompt: string;
    isActive?: boolean;
  }) => {
    try {
      const result = await upsertConfigMutation({
        variables: {
          entityType: input.entityType,
          entityId: input.entityId,
          whatsappNumber: input.whatsappNumber,
          catalogUrl: input.catalogUrl,
          systemPrompt: input.systemPrompt,
          isActive: input.isActive,
        },
      });
      return result.data?.upsertWhatsAppSalesAgentConfig as WhatsAppSalesAgentConfig | undefined;
    } catch (err) {
      throw new Error(getWhatsAppSalesAgentErrorMessage(err as ApolloError));
    }
  };

  return {
    config: data?.getWhatsAppSalesAgentConfig as WhatsAppSalesAgentConfig | null | undefined,
    loading: loading || saving,
    error: error || saveError,
    upsertConfig,
    refetch,
  };
};
