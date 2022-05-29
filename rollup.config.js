import typescript from 'rollup-plugin-typescript2';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import jsx from 'acorn-jsx';
import dts from 'rollup-plugin-dts';
import pkg from './package.json';

export default [{
  input: 'src/index.tsx',
  external: ['react-native', 'react'],
  output: [{
    file: pkg.main,
    format: 'cjs',
    sourcemap: true,
  }],

  // @see: https://github.com/rollup/plugins/tree/master/packages/typescript/#preserving-jsx-output
  acornInjectPlugins: [jsx()],
  plugins: [
    resolve(),
    typescript({
      compilerOptions: {
        noEmitOnError: true,
        declaration: true,
      },
    }),
    commonjs(),
  ],
}, {
  // consolidate all the type declaration files into one file
  input: './dist/src/index.d.ts',
  output: [{ file: 'dist/index.d.ts', format: 'es' }],
  plugins: [dts()],
}];
