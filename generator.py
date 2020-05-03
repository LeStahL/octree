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

def compressSource(source):
    lexer = GLSLLexer130.GLSLLexer130(source)
    token = lexer.token()
    smallerSource = ""
    lineHasPreprocessorDirective = False
    
    while token != None:
        if tokenIsPreprocessorDirective(token):
            lineHasPreprocessorDirective = True
            smallerSource += "\\n"
        if (not tokenIs(token, "SINGLELINE_COMMENT")) and (not tokenIs(token, "MULTILINE_COMMENT")):
            smallerSource += token.tokenData
            if tokenNeedsSpace(token):
                smallerSource += ' '
        if tokenIs(token, "CRLF"):
            if lineHasPreprocessorDirective:
                smallerSource += "\\n"
            lineHasPreprocessorDirective = False
        token = lexer.token()
    
    return smallerSource

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