import {
  SourceMapConsumer,
  type RawSourceMap,
} from "source-map/dist/source-map.js";

const sourcemapUrls: Record<string, RawSourceMap> = {};
const fetchingUrls: string[] = [];

export async function parseStackTraceFromSourcemap(
  stack: StackFrame[],
  sourcemapUrlParser: (file: string) => string = file => file + ".map",
): Promise<StackFrame[]> {
  // first off get all file names urls to be fetched
  for (const callSite of stack) {
    if (!callSite.fileName) continue;

    // check if it is fetched, if so then continue
    if (sourcemapUrls[callSite.fileName]) continue;

    // if file is not in fetchingUrls then add it to the list, we will wait for them all to be fetched
    if (!fetchingUrls.includes(callSite.fileName)) {
      fetchingUrls.push(callSite.fileName);
    }
  }

  // now fetch all the urls
  if (fetchingUrls.length > 0) {
    try {
      await loadSourcemapFiles(
        fetchingUrls.map(file => sourcemapUrlParser(file)),
      );

      // clear the fetching urls
      fetchingUrls.length = 0;
    } catch (error: any) {
      console.log("Failed to load sourcemaps", error.message);

      return stack;
    }
  }

  // source maps urls are teh same as js file name suffixed with .map
  for (const callSite of stack) {
    // source map object type is the first parameter of SourceMapConsumer
    const sourceMap = sourcemapUrls[sourcemapUrlParser(callSite.fileName!)];

    const consumer = await new SourceMapConsumer(sourceMap);

    const originalPosition = consumer.originalPositionFor({
      line: callSite.lineNumber!,
      column: callSite.columnNumber!,
    });

    // now replace the callSite with the original position
    callSite.fileName = originalPosition.source;
    callSite.lineNumber = originalPosition.line;
    callSite.columnNumber = originalPosition.column;
    if (originalPosition.name) {
      callSite.functionName = originalPosition.name;
    }
  }

  return stack;
}

export async function loadSourcemapFiles(fileNames: string[]) {
  return await Promise.all(
    fileNames.map(async fileName => {
      if (sourcemapUrls[fileName]) return sourcemapUrls[fileName];

      const response = await fetch(fileName);
      const text = await response.json();
      sourcemapUrls[fileName] = text;
      return text;
    }),
  );
}
