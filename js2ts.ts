import ts from 'typescript';
import fs from 'fs';

function transformer(context: ts.TransformationContext) {
    return (rootNode: ts.Node) => {
        function visit(node: ts.Node): ts.Node {


            if (ts.isVariableDeclaration(node)) {

                node = ts.factory.createVariableDeclaration(
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
                                ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword),
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
                            ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword),
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
                        ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword),
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
    //console.log(output)
    ts.sys.writeFile(file.replace('.js', '.ts'), output);
});

result.dispose();
