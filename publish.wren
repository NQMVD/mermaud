import "wrun/process" for Shell, Process
import "wrun/file" for File
import "wrun/args" for Args

class Publisher {
  static run() {
    // 1. Check if this is a git repository
    if (!File.isDirectory(".git")) {
      System.print("Error: Not a git repository.")
      Process.exit(1)
    }

    // 2. Determine Repo Name
    var repoName = Args.count() > 0 ? Args.get(0) : Process.cwd().split("/")[-1]
    var domain = "%(repoName).stardive.live"

    System.print("🚀 Starting deployment for project: %(repoName)...")

    // 3. GitHub: Create repo and push
    System.print("\n[1/3] Creating/Pushing to GitHub...")
    var ghStatus = Shell.exec("gh repo create %(repoName) --public --source=. --push")

    if (ghStatus != 0) {
      System.print("⚠️  GitHub step encountered an issue (repo might already exist).")
    }

    // 4. Vercel: Deploy to production
    System.print("\n[2/3] Deploying to Vercel...")
    // --yes uses default settings, --prod ensures it's a production build
    var vercelStatus = Shell.exec("vercel --prod --yes")

    if (vercelStatus != 0) {
      System.print("\n❌ Vercel deployment failed.")
      Process.exit(1)
    }

    // 5. Vercel: Assign Custom Domain
    System.print("\n[3/3] Assigning domain: %(domain)...")
    var domainStatus = Shell.exec("vercel domains add %(domain)")

    if (domainStatus == 0) {
      System.print("\nSuccess. Project live at: https://%(domain)")
    } else {
      System.print("\n⚠️  Deployment succeeded, but domain assignment failed.")
      System.print("Check if stardive.live is configured in your Vercel team/account.")
    }
  }
}

Publisher.run()
