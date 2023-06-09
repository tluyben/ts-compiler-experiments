import ts from 'typescript';
import fs from 'fs';

function createSenderCall(node: ts.Node, name: string): ts.ExpressionStatement {

    const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart())

    return ts.factory.createExpressionStatement(
        ts.factory.createCallExpression(
            ts.factory.createParenthesizedExpression(
                ts.factory.createArrowFunction(
                    [ts.factory.createModifier(ts.SyntaxKind.AsyncKeyword)],
                    undefined,
                    [],

                    ts.factory.createTypeReferenceNode("Promise", [ts.factory.createKeywordTypeNode(ts.SyntaxKind.VoidKeyword)]),
                    //ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword),
                    ts.factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
                    ts.factory.createBlock(
                        [
                            ts.factory.createExpressionStatement(
                                ts.factory.createCallExpression(
                                    ts.factory.createPropertyAccessExpression(
                                        ts.factory.createIdentifier('sender'),
                                        ts.factory.createIdentifier('send')
                                    ),
                                    [],
                                    [
                                        ts.factory.createObjectLiteralExpression(
                                            [
                                                ts.factory.createPropertyAssignment(
                                                    ts.factory.createIdentifier('line'),
                                                    ts.factory.createNumericLiteral(String(line + 1))
                                                ),
                                                ts.factory.createPropertyAssignment(
                                                    ts.factory.createIdentifier('name'),
                                                    ts.factory.createStringLiteral(name)
                                                ),
                                                ts.factory.createPropertyAssignment(
                                                    ts.factory.createIdentifier('content'),
                                                    ts.factory.createIdentifier(name)
                                                )
                                            ]

                                        )
                                    ]

                                )
                            )
                        ],
                        false
                    )
                )
            ),
            [],
            []
        )
    )
}
function handleStatement(statement: ts.Statement, newStatements: ts.Statement[]) {
    newStatements.push(statement)
    if (ts.isVariableStatement(statement)) {
        for (const declaration of statement.declarationList.declarations) {
            const n = declaration as ts.VariableDeclaration
            newStatements.push(createSenderCall(n, n.name.getText()))
        }
    }
}

function transformer(context: ts.TransformationContext) {

    return (rootNode: ts.Node) => {
        function visit(node: ts.Node): ts.Node {

            if (ts.isBlock(node)) {
                let newStatements: ts.Statement[] = [];

                for (const statement of node.statements) {
                    handleStatement(statement, newStatements)
                }

                node = ts.factory.updateBlock(node, newStatements)
            } else if (ts.isSourceFile(node)) {
                const importStatement = ts.factory.createImportDeclaration(
                    [],
                    ts.factory.createImportClause(
                        false,
                        undefined,
                        ts.factory.createNamedImports([
                            ts.factory.createImportSpecifier(false, undefined, ts.factory.createIdentifier('sender'))
                        ])
                    ),
                    ts.factory.createStringLiteral('./nosedive')
                )

                let newStatements: ts.Statement[] = [];

                for (const statement of node.statements) {
                    handleStatement(statement, newStatements)
                }


                node = ts.factory.updateSourceFile(node, [importStatement, ...newStatements]);

            } else if (ts.isVariableDeclaration(node)) {

                if (!node.type)
                    node = ts.factory.updateVariableDeclaration(
                        node,
                        node.name,
                        node.exclamationToken,
                        ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword),
                        node.initializer
                    )

            } else if (ts.isVariableStatement(node)) {

                node = ts.factory.updateVariableStatement(
                    node,
                    node.modifiers,
                    ts.factory.createVariableDeclarationList(
                        node.declarationList.declarations.map((d) => {
                            return ts.factory.createVariableDeclaration(
                                d.name,
                                d.exclamationToken,
                                d.type ?? ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword),
                                d.initializer
                            )
                        }),
                        node.declarationList.flags
                    )
                )

            } else if (ts.isMethodDeclaration(node)) {


                node = ts.factory.updateMethodDeclaration(
                    node,
                    node.modifiers,
                    node.asteriskToken,
                    node.name,
                    node.questionToken,
                    node.typeParameters,
                    node.parameters.map((p) => {
                        return ts.factory.createParameterDeclaration(
                            [],
                            p.dotDotDotToken,
                            p.name,
                            p.questionToken,
                            p.type ?? ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword),
                            p.initializer
                        )
                    }),
                    ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword),
                    node.body
                )


            } else if (ts.isFunctionDeclaration(node)) {

                const _parameters = node.parameters.map((p) => {
                    return ts.factory.createParameterDeclaration(
                        [],
                        p.dotDotDotToken,
                        p.name,
                        p.questionToken,
                        p.type ?? ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword),
                        p.initializer
                    )
                })

                node = ts.factory.updateFunctionDeclaration(
                    node,
                    [],
                    node.asteriskToken,
                    node.name,
                    [],
                    _parameters,
                    ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword),
                    node.body
                );

            } else if (ts.isArrowFunction(node)) {

                if (!node.type)
                    node = ts.factory.createArrowFunction(
                        node.modifiers,
                        node.typeParameters,
                        node.parameters.map((p) => {
                            return ts.factory.createParameterDeclaration(
                                [],
                                p.dotDotDotToken,
                                p.name,
                                p.questionToken,
                                ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword),
                                p.initializer
                            )
                        }),
                        ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword),
                        node.equalsGreaterThanToken,
                        node.body
                    )

            } else {
                //console.log(node.kind, node.getText()?.substring(0, 100))
            }
            return ts.visitEachChild(node, visit, context);
        }

        return ts.visitNode(rootNode, visit);
    };
}

const file = './flop.js'
const sourceFile = ts.createSourceFile(
    file,
    fs.readFileSync(file).toString(),
    ts.ScriptTarget.ES2015,
    /*setParentNodes */ true
);

const result = ts.transform(sourceFile, [transformer]);

const printer = ts.createPrinter();

result.transformed.forEach((n) => {
    const output = printer.printFile(n as ts.SourceFile);
    console.log(output)
    ts.sys.writeFile(file.replace('.js', '.ts'), output);
});

result.dispose();
