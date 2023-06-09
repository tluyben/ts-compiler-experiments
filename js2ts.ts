import { Project, SyntaxKind, TransformTraversalControl, ts } from "ts-morph";
import fs from "fs";

const project = new Project({

    tsConfigFilePath: "./tsconfig.json",
    skipFileDependencyResolution: true,

})

const file = './flop.js'
const sourceFile = project.addSourceFileAtPath(file)

sourceFile.forEachDescendant((node, traversal) => {
    console.log(node.getKindName(), node.getText())
})

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
            node.name,
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

sourceFile.transform((traversal: TransformTraversalControl) => {
    const node = traversal.visitChildren();

    if (ts.isArrowFunction(node)) {
        return traversal.factory.createArrowFunction(
            node.modifiers,
            node.typeParameters,
            node.parameters.map((p) => {
                return traversal.factory.createParameterDeclaration(
                    [],
                    p.dotDotDotToken,
                    p.name,
                    p.questionToken,
                    traversal.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword),
                    p.initializer
                )
            }),
            traversal.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword),
            node.equalsGreaterThanToken,
            node.body
        )
    }
    return node
})

console.log(sourceFile.getText())
fs.writeFileSync(file.replace('.js', '.ts'), sourceFile.getText())