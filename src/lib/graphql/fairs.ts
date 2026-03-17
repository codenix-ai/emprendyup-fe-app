import { gql } from '@apollo/client';

// ─── Fragments ────────────────────────────────────────────────────────────────

export const FAIR_FIELDS = gql`
  fragment FairFields on Fair {
    id
    storeId
    name
    startsAt
    endsAt
    status
    isActive
    closedAt
    createdAt
    updatedAt
  }
`;

export const FAIR_SALE_ITEM_FIELDS = gql`
  fragment FairSaleItemFields on FairSaleItem {
    id
    productId
    productName
    quantity
    unitPrice
  }
`;

export const FAIR_SALE_FIELDS = gql`
  fragment FairSaleFields on FairSale {
    id
    fairId
    storeId
    paymentMethod
    total
    currency
    customerName
    customerContact
    createdAt
    items {
      ...FairSaleItemFields
    }
  }
  ${FAIR_SALE_ITEM_FIELDS}
`;

// ─── Queries ──────────────────────────────────────────────────────────────────

export const GET_FAIRS_BY_STORE = gql`
  query FairsByStore($storeId: ID!) {
    fairsByStore(storeId: $storeId) {
      ...FairFields
    }
  }
  ${FAIR_FIELDS}
`;

export const GET_ACTIVE_FAIRS_BY_STORE = gql`
  query ActiveFairsByStore($storeId: ID!) {
    activeFairsByStore(storeId: $storeId) {
      ...FairFields
    }
  }
  ${FAIR_FIELDS}
`;

export const GET_FAIR = gql`
  query Fair($id: ID!) {
    fair(id: $id) {
      ...FairFields
    }
  }
  ${FAIR_FIELDS}
`;

export const GET_FAIR_SALES = gql`
  query FairSales($fairId: ID!) {
    fairSales(fairId: $fairId) {
      ...FairSaleFields
    }
  }
  ${FAIR_SALE_FIELDS}
`;

export const GET_FAIR_SUMMARY = gql`
  query FairSummary($fairId: ID!) {
    fairSummary(fairId: $fairId) {
      totalSold
      numberOfSales
      currency
    }
  }
`;

// ─── Mutations ────────────────────────────────────────────────────────────────

export const CREATE_FAIR = gql`
  mutation CreateFair($input: CreateFairInput!) {
    createFair(input: $input) {
      ...FairFields
    }
  }
  ${FAIR_FIELDS}
`;

export const CLOSE_FAIR = gql`
  mutation CloseFair($id: ID!) {
    closeFair(id: $id) {
      ...FairFields
    }
  }
  ${FAIR_FIELDS}
`;

export const CREATE_FAIR_SALE = gql`
  mutation CreateFairSale($fairId: ID!, $input: CreateFairSaleInput!) {
    createFairSale(fairId: $fairId, input: $input) {
      ...FairSaleFields
    }
  }
  ${FAIR_SALE_FIELDS}
`;

export const UPDATE_FAIR_SALE = gql`
  mutation UpdateFairSale($fairId: ID!, $saleId: ID!, $input: UpdateFairSaleInput!) {
    updateFairSale(fairId: $fairId, saleId: $saleId, input: $input) {
      ...FairSaleFields
    }
  }
  ${FAIR_SALE_FIELDS}
`;

export const DELETE_FAIR_SALE = gql`
  mutation DeleteFairSale($fairId: ID!, $saleId: ID!) {
    deleteFairSale(fairId: $fairId, saleId: $saleId)
  }
`;
