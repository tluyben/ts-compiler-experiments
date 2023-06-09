import { Project, SyntaxKind, TransformTraversalControl, ts } from "ts-morph";

const project = new Project({

    tsConfigFilePath: "./tsconfig.json",
    skipFileDependencyResolution: true,

});

const sourceFile = project.addSourceFileAtPath("./flop.js");

sourceFile.transform((traversal: TransformTraversalControl) => {
    const node = traversal.visitChildren();

    if (ts.isFunctionDeclaration(node)) {
        const _parameters = node.parameters.map((p) => {
            return traversal.factory.createParameterDeclaration(
                [],
                p.dotDotDotToken,
                p.name,
                p.questionToken,
                traversal.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword),
                p.initializer
            )
        })

        return traversal.factory.updateFunctionDeclaration(
            node,
            [],
            node.asteriskToken,
            traversal.factory.createIdentifier("add"),
            [],
            _parameters,
            traversal.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword),
            node.body
        );
    }


    return node
})

sourceFile.transform((traversal: TransformTraversalControl) => {
    const node = traversal.visitChildren();

    if (ts.isVariableDeclaration(node)) {
        return traversal.factory.createVariableDeclaration(
            node.name,
            node.exclamationToken,
            traversal.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword),
            node.initializer
        )
    }
    return node
})
console.log(sourceFile.getText())