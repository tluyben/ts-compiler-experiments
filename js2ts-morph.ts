import { Project, SyntaxKind, TransformTraversalControl, ts } from "ts-morph";
import fs from "fs";

const project = new Project({

    tsConfigFilePath: "./tsconfig.json",
    skipFileDependencyResolution: true,

})

const file = './ff.js'
const sourceFile = project.addSourceFileAtPath(file)

sourceFile.forEachDescendant((node, traversal) => {
    //if (node.getText().indexOf('initString') >= 0)
    console.log(node.getKindName(), node.getKind(), node.getText().substring(0, 100))
})

if (false) try {
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

        if (ts.isVariableDeclaration(node)) {
            // skip variables with initializer as there the type is already known (is it?)
            //if (!node.initializer) {
            return traversal.factory.createVariableDeclaration(
                node.name,
                node.exclamationToken,
                traversal.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword),
                node.initializer
            )
            //}
        }

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
} catch (e: any) {
    //console.log(e.message)
}

//console.log(sourceFile.getText())
//fs.writeFileSync(file.replace('.js', '.ts'), sourceFile.getText())