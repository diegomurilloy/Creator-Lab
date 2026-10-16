import { Config } from "@remotion/cli/config";

// Remotion descarga su propio Chrome headless la primera vez. Si prefieres usar el Chrome que ya tienes
// instalado, pon su ruta en la variable de entorno REMOTION_CHROME antes de correr studio/render/still.
if (process.env.REMOTION_CHROME) {
  Config.setBrowserExecutable(process.env.REMOTION_CHROME);
}
Config.setOverwriteOutput(true);
Config.setVideoImageFormat("jpeg");
Config.setConcurrency(4);
