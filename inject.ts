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
    if (ts.isExpressionStatement(statement)) {
        if (ts.isBinaryExpression(statement.expression)) {
            // here we handle assignments only for now 
            const n = statement.expression as ts.BinaryExpression
            if (n.operatorToken.kind === ts.SyntaxKind.EqualsToken) {
                if (ts.isIdentifier(n.left)) {
                    newStatements.push(createSenderCall(n, n.left.getText()))
                }
            }
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

                //if (!node.type)
                node = ts.factory.updateVariableDeclaration(
                    node,
                    node.name,
                    node.exclamationToken,
                    node.type ?? ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword),
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
                let body: ts.Statement[] = []

                let parameters = node.parameters.map((p) => {
                    // prepend a new expression to the body of the function for every parameter; 
                    body.push(createSenderCall(p, p.name.getText()))

                    return ts.factory.createParameterDeclaration(
                        [],
                        p.dotDotDotToken,
                        p.name,
                        p.questionToken,
                        p.type ?? ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword),
                        p.initializer
                    )
                })

                // append the body statemetns
                if (node.body) {
                    body.push(...node.body.statements)
                }


                node = ts.factory.updateMethodDeclaration(
                    node,
                    node.modifiers,
                    node.asteriskToken,
                    node.name,
                    node.questionToken,
                    node.typeParameters,
                    parameters,
                    node.type ?? ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword),
                    ts.factory.createBlock(body, true)
                )


            } else if (ts.isFunctionDeclaration(node)) {

                let body: ts.Statement[] = []

                const _parameters = node.parameters.map((p) => {
                    // prepend a new expression to the body of the function for every parameter; 
                    body.push(createSenderCall(p, p.name.getText()))

                    return ts.factory.createParameterDeclaration(
                        [],
                        p.dotDotDotToken,
                        p.name,
                        p.questionToken,
                        p.type ?? ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword),
                        p.initializer
                    )
                })

                // append the body statemetns
                if (node.body) {
                    body.push(...node.body.statements)
                }

                node = ts.factory.updateFunctionDeclaration(
                    node,
                    [],
                    node.asteriskToken,
                    node.name,
                    [],
                    _parameters,
                    ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword),
                    ts.factory.createBlock(body, true)
                );


            } else if (ts.isArrowFunction(node)) {
                let body: ts.Statement[] = []


                const parameters = node.parameters.map((p) => {
                    // prepend a new expression to the body of the function for every parameter; 
                    body.push(createSenderCall(p, p.name.getText()))

                    return ts.factory.createParameterDeclaration(
                        [],
                        p.dotDotDotToken,
                        p.name,
                        p.questionToken,
                        ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword),
                        p.initializer
                    )
                })

                // we need to change the body here, so this one is  a bit more complicated 


                // first check if this is an expression ? 
                if (ts.isExpression(node.body)) {
                    // that means we must wrap it in a block with a return 
                    body.push(ts.factory.createReturnStatement(node.body))

                } else {
                    // otherwise it's a block, so we can just append the statements 
                    body.push(...node.body.statements)
                }

                //if (!node.type)
                node = ts.factory.createArrowFunction(
                    node.modifiers,
                    node.typeParameters,
                    parameters,
                    node.type ?? ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword),
                    node.equalsGreaterThanToken,
                    ts.factory.createBlock(body, true)
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
