import java.io.*;

public class AdbCommand {
    public static void main(String[] args) throws IOException, InterruptedException {
        if (args.length != 4) {
            System.err.println("Usage: java AdbCommand <serialNumber> <filename> <pdaDir> <databaseRename>");
            System.exit(1);
        }

        String serialNumber = args[0];
        String filename = args[1];
        String pdaDir = args[2];
        String databaseRename = args[3];

        ProcessBuilder pb = new ProcessBuilder("adb", "-s", serialNumber, "exec-out", "run-as", "net.distrilog.easymobile", "cat", "app_webview/Default/databases/file__0/" + filename);

        pb.redirectOutput(new File(pdaDir + "\\" + databaseRename));

        Process process = pb.start();

        process.waitFor();
    }
}