import { gql } from '@apollo/client';

// Payment Mutations
export const CREATE_PAYMENT = gql`
  mutation CreatePayment($input: CreatePaymentInput!) {
    createPayment(input: $input) {
      id
      amount
      currency
      status
      provider
      paymentMethod
      description
      customerEmail
      customerPhone
      externalReference
      providerTransactionId
      referenceNumber
      createdAt
      order {
        id
        total
      }
      store {
        id
        name
      }
    }
  }
`;

export const PROCESS_PAYMENT = gql`
  mutation ProcessPayment($id: ID!) {
    processPayment(id: $id) {
      id
      status
      providerTransactionId
      errorMessage
      completedAt
      failedAt
    }
  }
`;

export const UPDATE_PAYMENT = gql`
  mutation UpdatePayment($id: ID!, $input: UpdatePaymentInput!) {
    updatePayment(id: $id, input: $input) {
      id
      status
      providerTransactionId
      referenceNumber
      errorCode
      errorMessage
      notes
      updatedAt
    }
  }
`;

export const REFUND_PAYMENT = gql`
  mutation RefundPayment($input: RefundPaymentInput!) {
    refundPayment(input: $input) {
      id
      status
      refundAmount
      refundReason
      refundedAt
    }
  }
`;

// Payment Queries
export const GET_PAYMENTS = gql`
  query GetPayments($filter: PaymentFilterInput, $pagination: PaymentPaginationInput) {
    payments(filter: $filter, pagination: $pagination) {
      id
      amount
      currency
      status
      provider
      paymentMethod
      paymentType
      customerEmail
      customerPhone
      description
      externalReference
      providerTransactionId
      referenceNumber
      errorCode
      errorMessage
      createdAt
      updatedAt
      completedAt
      failedAt
      refundedAt
      order {
        id
        total
        status
      }
      store {
        id
        name
      }
    }
  }
`;

export const GET_PAYMENT = gql`
  query GetPayment($id: ID!) {
    payment(id: $id) {
      id
      amount
      currency
      status
      provider
      paymentMethod
      paymentType
      description
      customerEmail
      customerPhone
      customerDocument
      customerDocumentType
      providerTransactionId
      referenceNumber
      externalReference
      errorCode
      errorMessage
      notes
      createdAt
      updatedAt
      completedAt
      failedAt
      refundedAt
      refundAmount
      refundReason
      order {
        id
        total
        status
      }
      store {
        id
        name
      }
    }
  }
`;

export const GET_PAYMENT_LOGS = gql`
  query GetPaymentLogs($paymentId: ID!) {
    paymentLogs(paymentId: $paymentId) {
      id
      action
      oldStatus
      newStatus
      changeReason
      changedBy
      notes
      createdAt
    }
  }
`;

export const GET_PAYMENT_SUMMARY = gql`
  query GetPaymentSummary($dateFrom: String, $dateTo: String) {
    paymentSummary(dateFrom: $dateFrom, dateTo: $dateTo) {
      totalPayments
      completedPayments
      totalAmount
      completedAmount
      refundedAmount
      successRate
      byProvider {
        provider
        count
        amount
      }
      byMethod {
        method
        count
        amount
      }
      byStatus {
        status
        count
        amount
      }
    }
  }
`;

// Configuration Queries and Mutations
export const GET_PAYMENT_CONFIGURATIONS = gql`
  query GetPaymentConfigurations($storeId: ID) {
    paymentConfigurations(storeId: $storeId) {
      id
      storeId
      cashEnabled
      wompiEnabled
      wompiPublicKey
      wompiTestMode
      mercadoPagoEnabled
      mercadoPagoPublicKey
      mercadoPagoTestMode
      epaycoEnabled
      epaycoPublicKey
      epaycoTestMode
      defaultCurrency
      autoCapture
      webhookUrl
      successUrl
      cancelUrl
      fraudCheckEnabled
      maxDailyAmount
      maxTransactionAmount
      createdAt
      updatedAt
    }
  }
`;

export const CREATE_PAYMENT_CONFIGURATION = gql`
  mutation CreatePaymentConfiguration($storeId: ID, $input: CreatePaymentConfigurationInput!) {
    createPaymentConfiguration(storeId: $storeId, input: $input) {
      id
      storeId
      cashEnabled
      wompiEnabled
      wompiPublicKey
      wompiTestMode
      mercadoPagoEnabled
      mercadoPagoPublicKey
      mercadoPagoTestMode
      epaycoEnabled
      epaycoPublicKey
      epaycoTestMode
      defaultCurrency
      autoCapture
      webhookUrl
      successUrl
      cancelUrl
      createdAt
    }
  }
`;

export const UPDATE_PAYMENT_CONFIGURATION = gql`
  mutation UpdatePaymentConfiguration(
    $id: ID!
    $storeId: ID
    $input: UpdatePaymentConfigurationInput!
  ) {
    updatePaymentConfiguration(id: $id, storeId: $storeId, input: $input) {
      id
      storeId
      cashEnabled
      wompiEnabled
      wompiPublicKey
      wompiTestMode
      mercadoPagoEnabled
      mercadoPagoPublicKey
      mercadoPagoTestMode
      epaycoEnabled
      epaycoPublicKey
      epaycoTestMode
      defaultCurrency
      autoCapture
      webhookUrl
      successUrl
      cancelUrl
      updatedAt
    }
  }
`;

// WhatsApp Sales Agent Config
export const GET_WHATSAPP_SALES_AGENT_CONFIG = gql`
  query GetWhatsAppSalesAgentConfig($entityType: EntityType!, $entityId: String!) {
    getWhatsAppSalesAgentConfig(entityType: $entityType, entityId: $entityId) {
      id
      entityType
      entityId
      whatsappNumber
      catalogUrl
      systemPrompt
      promptVersion
      isActive
      updatedAt
    }
  }
`;

export const UPSERT_WHATSAPP_SALES_AGENT_CONFIG = gql`
  mutation UpsertWhatsAppSalesAgentConfig(
    $entityType: EntityType!
    $entityId: String!
    $whatsappNumber: String!
    $catalogUrl: String!
    $systemPrompt: String!
    $isActive: Boolean
  ) {
    upsertWhatsAppSalesAgentConfig(
      entityType: $entityType
      entityId: $entityId
      whatsappNumber: $whatsappNumber
      catalogUrl: $catalogUrl
      systemPrompt: $systemPrompt
      isActive: $isActive
    ) {
      id
      whatsappNumber
      catalogUrl
      systemPrompt
      promptVersion
      isActive
      updatedAt
    }
  }
`;

export const UPDATE_ORDER = gql`
  mutation UpdateOrder($id: ID!, $input: UpdateOrderStatusInput!) {
    updateOrder(id: $id, input: $input) {
      id
      status
      updatedAt
      shipping
      tax
    }
  }
`;

export const ORDERS_BY_USER = gql`
  query OrdersByUser($userId: String!) {
    ordersByUser(userId: $userId) {
      id
      status
      createdAt
      updatedAt
      subtotal
      shipping
      tax
      total
      store {
        id
        name
        storeId
      }
      items {
        productId
        productName
        quantity
        unitPrice
      }
    }
  }
`;

// User Queries and Mutations
export const GET_USER = gql`
  query GetUser($id: ID!) {
    user(id: $id) {
      id
      name
      membershipLevel
      email
      role
      store {
        id
        name
      }
    }
  }
`;

export const UPDATE_USER = gql`
  mutation UpdateUser($id: ID!, $input: UpdateUserInput!) {
    updateUser(id: $id, input: $input) {
      id
      name
      email
      membershipLevel
      role
      store {
        id
        name
      }
    }
  }
`;
export const GET_ALL_STORES_FOR_ADMIN = gql`
  query GetAllStoresForAdmin {
    getAllStoresForAdmin {
      id
      storeId
      name
      description
      users {
        id
        email
        role
      }
    }
  }
`;

// Order Mutations
export const CREATE_ORDER = gql`
  mutation CreateOrder($input: CreateOrderInput!) {
    createOrder(input: $input) {
      id
      status
      subtotal
      shipping
      tax
      total
      createdAt
      items {
        productId
        productName
        quantity
        price
      }
      store {
        id
        name
      }
    }
  }
`;

// Product Queries
export const GET_PRODUCTS_BY_STORE = gql`
  query GetProductsByStore($storeId: String!, $page: Int, $pageSize: Int) {
    productsByStore(storeId: $storeId, page: $page, pageSize: $pageSize) {
      items {
        id
        name
        title
        description
        price
        currency
        available
        inStock
        stock
        metadata
        images {
          id
          url
          order
        }
        categories {
          category {
            id
            name
            slug
          }
        }
      }
      total
      page
      pageSize
    }
  }
`;

export const GET_SUBSCRIPTION_PRODUCTS = gql`
  query GetSubscriptionProducts($storeId: String!) {
    productsByStore(storeId: $storeId, page: 1, pageSize: 100) {
      items {
        id
        name
        title
        description
        price
        currency
        available
        images {
          id
          url
          order
        }
      }
      total
      page
      pageSize
    }
  }
`;
