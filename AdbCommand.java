import java.io.*;
import java.nio.file.Path;
import java.nio.file.Paths;

public class AdbCommand {
    public static void main(String[] args) throws IOException, InterruptedException {
        if (args.length != 5) {
            System.err.println("Usage: java AdbCommand <serialNumber> <filename> <pdaDir> <databaseRename>");
            System.exit(1);
        }

        String serialNumber = args[0];
        String filename = args[1];
        String pdaDir = args[2];
        String databaseRename = args[3];
        String location = args[4];

        String filePath;
        if ("new".equalsIgnoreCase(location)) {
            filePath = "databases/" + filename;
        } else {
            filePath = "app_webview/Default/databases/file__0/" + filename;
        }

        ProcessBuilder pb = new ProcessBuilder(
            "adb", "-s",
            serialNumber,
            "exec-out",
            "run-as",
            "net.distrilog.easymobile",
            "cat",
            filePath
        );

        Path outputFile = Paths.get(pdaDir, databaseRename);
        pb.redirectOutput(outputFile.toFile());

        Process process = pb.start();
        process.waitFor();
    }
}