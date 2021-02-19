import { describe, test, expect } from "@jest/globals";
import createUpdateAndParams from "../../../src/translate/create-update-and-params";
import { Neo4jGraphQL, Context, Node } from "../../../src/classes";
import { trimmer } from "../../../src/utils";

describe("createUpdateAndParams", () => {
    test("should return the correct update and params", () => {
        const idField = {
            fieldName: "id",
            typeMeta: {
                name: "String",
                array: false,
                required: false,
                pretty: "String",
                input: {
                    name: "String",
                    pretty: "String",
                },
            },
            otherDirectives: [],
            arguments: [],
        };

        // @ts-ignore
        const node: Node = {
            name: "Movie",
            relationFields: [],
            cypherFields: [],
            enumFields: [],
            unionFields: [],
            scalarFields: [],
            primitiveFields: [idField],
            dateTimeFields: [],
            interfaceFields: [],
            objectFields: [],
            pointFields: [],
            mutableFields: [idField],
            authableFields: [],
        };

        // @ts-ignore
        const neoSchema: Neo4jGraphQL = {
            nodes: [node],
        };

        // @ts-ignore
        const context = new Context({ neoSchema });

        const result = createUpdateAndParams({
            updateInput: { id: "new" },
            node,
            context,
            varName: "this",
            parentVar: "this",
            withVars: ["this"],
        });

        expect(trimmer(result[0])).toEqual(
            trimmer(`
                SET this.id = $this_update_id
            `)
        );

        expect(result[1]).toMatchObject({
            this_update_id: "new",
        });
    });
});
