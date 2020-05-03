# Cozy - 4k executable GFX by NR4/Team210 at Under Construction 2k19
# Copyright (C) 2019 Alexander Kraus <nr4@z10.info>
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

cmake_minimum_required(VERSION 3.12)
project(octree)

set(DEBUG OFF)

set(CMAKE_MODULE_PATH "${PROJECT_SOURCE_DIR}/thirdparty/FindWindowsSDK")

find_package(Python3 REQUIRED COMPONENTS Interpreter)
find_package(OpenGL REQUIRED COMPONENTS OpenGL)
find_package(WindowsSDK REQUIRED)
get_windowssdk_include_dirs(${WINDOWSSDK_LATEST_DIR} WINDOWS_INCLUDE)
string(REPLACE ";" "\" /I\"" WINDOWS_INCLUDE "${WINDOWS_INCLUDE}")

find_program(CRINKLER NAMES crinkler.exe PATHS "${PROJECT_SOURCE_DIR}/bin")

get_filename_component(STDC_INCLUDE "${CMAKE_C_COMPILER}" DIRECTORY)
set(STDC_INCLUDE "${STDC_INCLUDE}/../../../include")

set(SOURCE "${PROJECT_SOURCE_DIR}/${PROJECT_NAME}.c")

set(COMPILER_COMMAND "\"${CMAKE_C_COMPILER}\" /I\"${WINDOWS_INCLUDE}\" /I\"${STDC_INCLUDE}\" /DWIN32 /c /Gy /O1 /fp:fast /GR- /GS- /MT \"${PROJECT_SOURCE_DIR}/${PROJECT_NAME}.c\" /Fo\"${PROJECT_BINARY_DIR}/${PROJECT_NAME}.obj\"")
if(DEBUG)
    set(LINKER_COMMAND "${CRINKLER} /ENTRY:demo /SUBSYSTEM:Windows /LARGEADDRESSAWARE /PROGRESSGUI /COMPMODE:FAST /PRIORITY:NORMAL \"${PROJECT_BINARY_DIR}/${PROJECT_NAME}.obj\" opengl32.lib User32.lib Winmm.lib Kernel32.lib Gdi32.lib /out:\"${PROJECT_BINARY_DIR}/${PROJECT_NAME}.exe\"")
else()
    set(LINKER_COMMAND "${CRINKLER} /ENTRY:demo /SUBSYSTEM:Windows /LARGEADDRESSAWARE /PROGRESSGUI /COMPMODE:VERYSLOW /PRIORITY:NORMAL \"${PROJECT_BINARY_DIR}/${PROJECT_NAME}.obj\" opengl32.lib User32.lib Winmm.lib Kernel32.lib Gdi32.lib /out:\"${PROJECT_BINARY_DIR}/${PROJECT_NAME}.exe\"")
endif()

configure_file("${PROJECT_SOURCE_DIR}/cmake/build.bat.in" "${PROJECT_BINARY_DIR}/build.bat" NEWLINE_STYLE WIN32)

add_custom_target(${PROJECT_NAME} ALL COMMAND "${PROJECT_BINARY_DIR}/build.bat" WORKING_DIRECTORY "${PROJECT_SOURCE_DIR}")
