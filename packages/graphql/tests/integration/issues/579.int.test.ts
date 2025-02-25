import { graphql } from "graphql";
import { Driver } from "neo4j-driver";
import { generate } from "randomstring";
import { Neo4jGraphQL } from "../../../src/classes";
import neo4j from "../neo4j";

describe("579", () => {
    let driver: Driver;

    beforeAll(async () => {
        driver = await neo4j();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should update an Edge property in a one to one relationship", async () => {
        const session = driver.session();

        const typeDefs = `
          type Product {
             id: ID
             color: Color! @relationship(type: "OF_COLOR", direction: OUT, properties: "OfColorProperties")
           }

           interface OfColorProperties @relationshipProperties {
               test: Boolean
           }

           type Color {
             name: String
             id: ID
           }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        const productId = generate({
            charset: "alphabetic",
        });

        const colorId = generate({
            charset: "alphabetic",
        });

        const query = `
            mutation {
                updateProducts(
                  where: { id: "${productId}" }
                  update: {
                      color: {
                          update: {
                              edge: {
                                  test: true
                              }
                          }
                      }
                  }
                ) {
                    products {
                        id
                        colorConnection {
                            edges {
                                test
                            }
                        }
                    }
                }
              }
        `;

        try {
            await session.run(
                `
                    CREATE (product:Product {name: "Pringles", id: $productId})
                    CREATE (color:Color {name: "Yellow", id: $colorId})
                    MERGE (product)-[:OF_COLOR { test: false }]->(color)
            `,
                {
                    productId,
                    colorId,
                }
            );

            const gqlResult = await graphql({
                schema: neoSchema.schema,
                source: query,
                variableValues: {},
                contextValue: { driver, driverConfig: { bookmarks: session.lastBookmark() } },
            });

            expect(gqlResult.errors).toBeFalsy();

            expect((gqlResult?.data?.updateProducts.products as any[])[0]).toMatchObject({
                id: productId,
                colorConnection: {
                    edges: [
                        {
                            test: true,
                        },
                    ],
                },
            });
        } finally {
            await session.close();
        }
    });
});
