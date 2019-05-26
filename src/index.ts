import fs from 'fs';
import path from 'path';
import process from 'process';
import archiver from 'archiver';
import fse from 'fs-extra';
import ora from 'ora';

const isDirectory = (fullPathname: string) =>
  fs.statSync(fullPathname).isDirectory();

const makeZip = (dirToCompress: string) =>
  new Promise((resolve, reject) => {
    const outputFilename = `${dirToCompress}.zip`;
    const output = fs.createWriteStream(outputFilename);

    output.on('close', function() {
      fse.removeSync(dirToCompress);
      console.log(`done. ${dirToCompress}`);
      resolve(true);
    });

    const archive = archiver('zip', {
      zlib: { level: 5 } // Sets the compression level.
    });

    archive.on('error', function(err) {
      reject(err);
    });

    archive.directory(dirToCompress, false);

    // pipe archive data to the file
    archive.pipe(output);
    archive.finalize();
  });

const main = async () => {
  const targetDir = path.resolve(process.argv[2] || './');
  if (!targetDir) {
    console.log('Usage: npm start <target_dirname>');
    return;
  }
  const dirs = fs
    .readdirSync(targetDir)
    .filter(x => !x.startsWith('.') && isDirectory(path.join(targetDir, x)));

  const spinner = ora('zipping... ').start();
  await Promise.all(dirs.map(x => makeZip(path.join(targetDir, x)))).then(
    () => {
      spinner.stop();
      console.log('done.');
    }
  );
};

main();
