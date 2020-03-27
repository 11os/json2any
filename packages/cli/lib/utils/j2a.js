"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const j2a_1 = require("@j2a/j2a");
exports.TEMPLATE_TYPESCRIPT = `export interface ###CLAZZ### {###PARAMS###
}

###LOOPS###`;
exports.TEMPLATE_DART = `@JsonSerializable()
class ###CLAZZ### {###PARAMS###
  ###CLAZZ###({ ###CONSTRUCTOR### });

  factory ###CLAZZ###.fromJson(Map<String, dynamic> json) => _$###CLAZZ###FromJson(json);

  Map<String, dynamic> toJson() => _$###CLAZZ###ToJson(this);
}

###LOOPS###`;
var ParseTypeEnum;
(function (ParseTypeEnum) {
    ParseTypeEnum[ParseTypeEnum["typescript"] = 1] = "typescript";
    ParseTypeEnum[ParseTypeEnum["dart"] = 2] = "dart";
})(ParseTypeEnum = exports.ParseTypeEnum || (exports.ParseTypeEnum = {}));
exports.ParseType = {
    typescript: ParseTypeEnum.typescript,
    dart: ParseTypeEnum.dart
};
exports.fileSuffix = {
    [ParseTypeEnum.typescript]: "ts",
    [ParseTypeEnum.dart]: "dart"
};
exports.KeymapTypescript = (identifier) => {
    return {
        [j2a_1.JsonType.int]: "number",
        [j2a_1.JsonType.bigInt]: "number",
        [j2a_1.JsonType.double]: "number",
        [j2a_1.JsonType.string]: "string",
        [j2a_1.JsonType.object]: `${exports.FirstUpperCase(identifier)}`,
        [j2a_1.JsonType.array]: `${exports.FirstUpperCase(identifier)}[]`,
        [j2a_1.JsonType.bool]: "boolean",
        [j2a_1.JsonType.null]: "any",
        [j2a_1.JsonType.any]: "any"
    };
};
exports.KeymapDart = (identifier) => {
    return {
        [j2a_1.JsonType.int]: "number",
        [j2a_1.JsonType.bigInt]: "Int64",
        [j2a_1.JsonType.double]: "double",
        [j2a_1.JsonType.string]: "String",
        [j2a_1.JsonType.object]: `${exports.FirstUpperCase(identifier)}`,
        [j2a_1.JsonType.array]: `List<${exports.FirstUpperCase(identifier)}>`,
        [j2a_1.JsonType.bool]: "bool",
        [j2a_1.JsonType.null]: "Null",
        [j2a_1.JsonType.any]: "Null"
    };
};
exports.getKeymap = (type) => {
    return {
        [ParseTypeEnum.typescript]: exports.KeymapTypescript,
        [ParseTypeEnum.dart]: exports.KeymapDart
    }[type];
};
exports.getGenerator = (type) => {
    return {
        [ParseTypeEnum.typescript]: generateTypescript,
        [ParseTypeEnum.dart]: generateDart
    }[type];
};
function j2a(input, output, type) {
    try {
        // input dir
        const inputFiles = fs.readdirSync(input, {
            withFileTypes: true
        });
        // console.log(`inputFiles = `, inputFiles);
        // output dir
        const outputFiles = fs.readdirSync(output, {
            withFileTypes: true
        });
        // console.log(`outputFiles =`, outputFiles);
        // start
        inputFiles.forEach(file => {
            let json = fs.readFileSync(`${input}/${file.name}`, "utf8");
            // console.log(json);
            let fileName = file.name.split(".")[0];
            let result = generate({
                json,
                clazz: fileName,
                type
            });
            fs.writeFileSync(`${output}/${fileName}.${exports.fileSuffix[type]}`, result);
            console.log(`generate ${output}/${fileName}.${exports.fileSuffix[type]} success`);
        });
    }
    catch (error) {
        console.log(error);
    }
}
exports.j2a = j2a;
function generate({ json, clazz, type }) {
    let keymap = exports.getKeymap(type);
    let gen = exports.getGenerator(type);
    return gen({ json, clazz, keymap });
}
exports.generate = generate;
function generateTypescript({ json, ast, clazz, keymap }) {
    const { params, loops } = ast ? parse({ ast }) : parse({ json });
    let template = exports.TEMPLATE_TYPESCRIPT;
    let paramsString = params
        .map(param => `\n  ${param.identifier}: ${keymap(param.identifier)[param.type]};${param.comment && ` // ${param.comment}`}`)
        .join("");
    template = template.replace(/###PARAMS###/g, paramsString);
    template = template.replace(/###CLAZZ###/g, clazz || "");
    template = template.replace(/###LOOPS###/g, loops
        .map(loop => generateTypescript({ ast: loop.node, clazz: loop.clazz, keymap }))
        .join(""));
    return template;
}
exports.generateTypescript = generateTypescript;
function generateDart({ json, ast, clazz, keymap }) {
    const { params, loops } = ast ? parse({ ast }) : parse({ json });
    let template = exports.TEMPLATE_DART;
    let paramsString = params
        .map(param => `\n  ${keymap(param.identifier)[param.type]}: ${param.identifier};${param.comment && ` // ${param.comment}`}`)
        .join("");
    template = template.replace(/###PARAMS###/g, paramsString);
    let constructor = params.map(param => `this.${param.identifier}`).join(", ");
    template = template.replace(/###CONSTRUCTOR###/g, constructor);
    template = template.replace(/###CLAZZ###/g, clazz || "");
    template = template.replace(/###LOOPS###/g, loops
        .map(loop => generateDart({ ast: loop.node, clazz: loop.clazz, keymap }))
        .join(""));
    return template;
}
exports.generateDart = generateDart;
function parse({ json = "", ast }) {
    let newAst = ast ? ast : j2a_1.compiler(json);
    let loops = [];
    let params = [];
    function pushParams({ type, identifier, comment }) {
        params.push({
            type,
            identifier,
            comment: comment ? comment : !identifier ? "⚠️⚠️⚠️ empty name" : ""
        });
    }
    j2a_1.traverser({
        ast: newAst,
        deep: false,
        visitor: {
            [j2a_1.NodeTypes.ObjectProperty]: {
                enter(node, parent) {
                    var _a, _b, _c, _d, _e, _f, _g;
                    let nodeValue = (_a = node.params) === null || _a === void 0 ? void 0 : _a[0];
                    let identifier = node.identifier || "";
                    let clazz = exports.FirstUpperCase(identifier);
                    switch ((_b = nodeValue) === null || _b === void 0 ? void 0 : _b.type) {
                        case j2a_1.NodeTypes.BooleanLiteral:
                            pushParams({
                                type: j2a_1.JsonType.bool,
                                identifier
                            });
                            break;
                        case j2a_1.NodeTypes.NumericLiteral:
                            let type = j2a_1.JsonType.int;
                            let value = (_d = (_c = nodeValue) === null || _c === void 0 ? void 0 : _c.value, (_d !== null && _d !== void 0 ? _d : "0"));
                            if (value.includes(".")) {
                                type = j2a_1.JsonType.double;
                            }
                            else if (((_e = value) === null || _e === void 0 ? void 0 : _e.length) >= 10) {
                                type = j2a_1.JsonType.bigInt;
                            }
                            pushParams({
                                type,
                                identifier
                            });
                            break;
                        case j2a_1.NodeTypes.ObjectExpression:
                            pushParams({
                                type: j2a_1.JsonType.object,
                                identifier
                            });
                            loops.push({
                                node: nodeValue,
                                clazz: clazz
                            });
                            break;
                        case j2a_1.NodeTypes.ArrayExpression:
                            pushParams({
                                type: j2a_1.JsonType.array,
                                identifier
                            });
                            loops.push({
                                node: (_g = (_f = nodeValue) === null || _f === void 0 ? void 0 : _f.params) === null || _g === void 0 ? void 0 : _g[0],
                                clazz: clazz
                            });
                            break;
                        case j2a_1.NodeTypes.StringLiteral:
                            pushParams({
                                type: j2a_1.JsonType.string,
                                identifier
                            });
                            break;
                        case j2a_1.NodeTypes.NullLiteral:
                        default:
                            pushParams({
                                type: j2a_1.JsonType.any,
                                identifier,
                                comment: "⚠️⚠️⚠️ null value"
                            });
                            break;
                    }
                }
            }
        }
    });
    return { params, loops };
}
exports.parse = parse;
exports.FirstUpperCase = (value) => {
    return value.charAt(0).toUpperCase() + value.slice(1);
};