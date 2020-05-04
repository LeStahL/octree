# Spacerace 69 - Evoke 2k20 invitation by Team210 shown at Revision 2k20
# Copyright (C) 2019  Alexander Kraus <nr4@z10.info>
# 
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
# 
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
# 
# You should have received a copy of the GNU General Public License
# along with this program.  If not, see <https://www.gnu.org/licenses/>.

import argparse, json, os.path
import GLSLLexer130

def tokenIs(token, identifier):
    if token != None:
        if token.tokenName == identifier:
            return True
    return False

def tokenIsDataType(token):
    dataTypeTokenNames = [ "VOID", "FLOAT", "VEC2", "VEC3", "VEC4", "MAT2", "MAT3", "MAT4", "BVEC2", "BVEC3", "BVEC4", "UVEC2", "UVEC3", "UVEC4", "INT" ]
    if token != None:
        if token.tokenName in dataTypeTokenNames:
            return True
    return False

def hasEntryPoint(source):
    lexer = GLSLLexer130.GLSLLexer130(source)
    token = lexer.token()
    while token != None:
        if tokenIs(token, "VOID"):
            token = lexer.token()
            if tokenIs(token, "MAIN"):
                token = lexer.token()
                if tokenIs(token, "LPAREN"):
                    token = lexer.token()
                    if tokenIs(token, "RPAREN"):
                        return True
        token = lexer.token()
    return False

def containedSymbolPrototypes(source):
    lexer = GLSLLexer130.GLSLLexer130(source)
    token = lexer.token()
    symbolList = []
    
    while token != None:
        if tokenIsDataType(token):
            token = lexer.token()
            if tokenIs(token, "IDENTIFIER"):
                symbolIdentifier = token.tokenData
                token = lexer.token()
                if tokenIs(token, "LPAREN"):
                    token = lexer.token()
                    if tokenIs(token, "RPAREN"):
                        token = lexer.token()
                        if tokenIs(token, "SEMICOLON"):
                            symbolList += [ symbolIdentifier ]
                    else:
                        # Ignore the now following argument list; it does not matter at all.
                        while not tokenIs(token, "RPAREN"):
                            token = lexer.token()
                        token = lexer.token()
                        if tokenIs(token, "SEMICOLON"):
                            symbolList += [ symbolIdentifier ]
        token = lexer.token()
    return symbolList

def tokenNeedsSpace(token):
    tokenNamesWithSpace = [ "VOID", "FLOAT", "VEC2", "VEC3", "VEC4", "MAT2", "MAT3", "MAT4", "SAMPLER2D", "UNIFORM", "IN_QUALIFIER", "OUT_QUALIFIER", "INOUT_QUALIFIER", "VOID", "VERSION_DIRECTIVE", "DEFINE_DIRECTIVE", "CONST", "INT", "ELSE", "RETURN" ]
    if token != None:
        if token.tokenName in tokenNamesWithSpace:
            return True
    return False

def tokenIsPreprocessorDirective(token):
    preprocessorTokenNames = [ "VERSION_DIRECTIVE", "DEFINE_DIRECTIVE" ]
    if token != None:
        if token.tokenName in preprocessorTokenNames:
            return True
    return False

def generateIdentifier(characters, numbers, index):
    characterKeys = list(characters.keys())
    numberKeys = list(numbers.keys())
    
    if index < len(characterKeys):
        return characterKeys[index]
    else:
        return characterKeys[index % len(characterKeys)] + numberKeys[index // len(characterKeys)]

def compressSource(source):
    lexer = GLSLLexer130.GLSLLexer130(source)
    token = lexer.token()
    smallerSource = ""
    lineHasPreprocessorDirective = False
    
    characters = {}
    numbers = {}
    for character in source:
        if not character in "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ":
            if character in "0123456789":
                if character in numbers:
                    numbers[character] += 1
                else:
                    numbers[character] = 1
            continue
        if character in characters:
            characters[character] += 1
        else:
            characters[character] = 1
    characters = {k: v for k, v in reversed(sorted(characters.items(), key=lambda item: item[1]))}
    numbers = {k: v for k, v in reversed(sorted(numbers.items(), key=lambda item: item[1]))}

    isUniform = False
    uniforms = []
    ids = {}

    # Simple optimizations
    while token != None:
        if (not tokenIs(token, "SINGLELINE_COMMENT")) and (not tokenIs(token, "MULTILINE_COMMENT")):
            smallerSource += token.tokenData
            if tokenNeedsSpace(token):
                smallerSource += ' '
        
        if tokenIs(token, "UNIFORM"):
            isUniform = True
        if tokenIs(token, "SEMICOLON"):
            isUniform = False
        if tokenIs(token, "IDENTIFIER"):
            if isUniform:
                uniforms += [ token.tokenData ]
            if not (token.tokenData in uniforms):
                if token.tokenData in ids:
                    ids[token.tokenData] += 1
                else:
                    ids[token.tokenData] = 1
        token = lexer.token()
    
    # Sort the ids by probability
    ids = {k: v for k, v in reversed(sorted(ids.items(), key=lambda item: item[1]))}
    idList = list(ids.keys())

    dictionary = {}
    for i in range(len(idList)):
        id = idList[i]
        dictionary[id] = generateIdentifier(characters, numbers, i)

    # print(smallerSource)
    # f = open("smallerSource", "wt")
    # f.write(smallerSource)
    # f.close()

    # Context model optimizations
    smallestSource = ""
    lexer = GLSLLexer130.GLSLLexer130(smallerSource)
    token = lexer.token()
    while token != None:
        if tokenIsPreprocessorDirective(token):
            lineHasPreprocessorDirective = True
            smallestSource += "\\n"
        if tokenIs(token, "CRLF"):
            if lineHasPreprocessorDirective:
                smallestSource += "\\n"
            lineHasPreprocessorDirective = False
        if tokenIs(token, "IDENTIFIER"):
            smallestSource += dictionary[token.tokenData]
        else:
            smallestSource += token.tokenData
            if tokenNeedsSpace(token):
                smallestSource += ' '
        # print(token.tokenData)
        token = lexer.token()
    
    # print(smallestSource)
    ff = open("smallestSource", "wt")
    ff.write(smallestSource)
    ff.close()

    return smallestSource

def sourceVariable(name, source):
    ret = "const char *" + name + " =\n"
    for line in source.split('\n'):
        ret += "\"" + line + "\"\n"
    ret += ";\n"
    return ret

parser = argparse.ArgumentParser(description='Team210 generator tool.')
parser.add_argument('-o', '--output', dest='out')
args, rest = parser.parse_known_args()

if rest == []:
    print('No input file present. Can not do anything.')
    exit()

if args.out == None:
    print('No output specified. Will exit.')
    exit()

f = open(rest[0], "rt")
source = f.read()
f.close()

f = open(args.out, "wt")
f.write(sourceVariable('gfx_source', compressSource(source)))
f.close()