export const typeDefs = `#graphql
  type Category {
    id: ID!
    name: String!
    depth: Int!
    fullPath: String!
    isActive: Boolean!
    parent: CategorySummary
    ancestors: [CategorySummary!]!
    createdAt: String!
    updatedAt: String!
  }

  type CategorySummary {
    id: ID!
    name: String!
    depth: Int!
    fullPath: String!
    isActive: Boolean!
  }

  type DeleteCategoryPayload {
    success: Boolean!
    message: String!
  }

  input CreateCategoryInput {
    name: String!
    parentId: ID
    isActive: Boolean
  }

  input UpdateCategoryInput {
    name: String
    parentId: ID
    isActive: Boolean
  }

  type Query {
    categories(includeInactive: Boolean = false): [Category!]!
    category(id: ID!): Category!
    searchCategories(query: String!, includeInactive: Boolean = false): [Category!]!
  }

  type Mutation {
    createCategory(input: CreateCategoryInput!): Category!
    updateCategory(id: ID!, input: UpdateCategoryInput!): Category!
    deactivateCategory(id: ID!): Category!
    activateCategory(id: ID!): Category!
    deleteCategory(id: ID!): DeleteCategoryPayload!
  }
`;
