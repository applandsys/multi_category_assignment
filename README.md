# Backend Developer Assignment — Nested Categories API using
### Please note category depth can be unlimited changing the env value MAX_CATEGORY_DEPTH=4
- Node.js
- TypeScript
- Express.js
- MongoDB / Mongoose
- REST API
- GraphQL
- Redis caching using Upstash cloud


## How to Check the Server is Okay
```
npm run dev

```

then access http://localhost:4000/test

## REST API END POINTS

```
Content-Type: application/json
{
  "name": "TV",
  "parentId": "<electronics_id>"
}


All Categories (GET): 
http://localhost:4000/api/categories

Category By Id (GET):
http://localhost:4000/api/categories/(documentId will goes here)

Category Item Search (GET):
http://localhost:4000/api/categories/search?q=tv

Insert Category (POST):
http://localhost:4000/api/categories

Update Category (PATCH):
http://localhost:4000/api/categories

Deactive Category (POST):
http://localhost:4000/api/categories/:id/deactivate

Activate Category (POST):
http://localhost:4000/api/categories/:id/activate

Activate Category (DELETE):
http://localhost:4000/api/categories/:id

```

## INSERT DEMO DATA WITH SEED
```
npm run seed
```

### GRAPH QL TEST
```
Method (POST):
http://localhost:4000//graphql
```

```query Example 
query {
  categories {
    id
    name
    depth
    fullPath
    isActive
    parent {
      id
      name
      fullPath
    }
  }
}
```
