import { existsSync, mkdirSync, unlinkSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'

// Chemin du dossier de configuration
const configDir = join(homedir(), 'dtl_runpda')

// Chemin complet du fichier config.json
const jsonPath = join(configDir, 'config.json')

try {
  if (!existsSync(configDir))
    mkdirSync(configDir)

  if (existsSync(jsonPath))
    unlinkSync(jsonPath)

} catch (err) {
  console.error('Preinstall error:', err)
}

const logDir = join(configDir, 'log')

try {
  if (!existsSync(logDir))
    mkdirSync(logDir)
} catch (err) {
  console.error('Log dir creation error:', err)
}
