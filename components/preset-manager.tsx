"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Save, Download, Trash2, FileDown, FileUp, Star, User } from "lucide-react"
import { PresetManager, type SynthPreset } from "../utils/presets"
import type { SynthParams } from "../utils/synthesizer"

interface PresetManagerProps {
  currentParams: SynthParams
  onLoadPreset: (params: SynthParams) => void
  onParamsChange: (params: SynthParams) => void
}

export function PresetManagerComponent({ currentParams, onLoadPreset }: PresetManagerProps) {
  const [presets, setPresets] = useState<SynthPreset[]>(PresetManager.getAllPresets())
  const [selectedPreset, setSelectedPreset] = useState<SynthPreset | null>(null)
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [saveForm, setSaveForm] = useState({
    name: "",
    category: "User",
    description: "",
  })
  const [importText, setImportText] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("All")

  const categories = ["All", ...Object.keys(PresetManager.getPresetsByCategory())]
  const filteredPresets = selectedCategory === "All" ? presets : presets.filter((p) => p.category === selectedCategory)

  const handleSavePreset = () => {
    if (!saveForm.name.trim()) return

    const newPreset = PresetManager.savePreset({
      name: saveForm.name.trim(),
      category: saveForm.category,
      description: saveForm.description.trim(),
      params: currentParams,
    })

    setPresets(PresetManager.getAllPresets())
    setShowSaveDialog(false)
    setSaveForm({ name: "", category: "User", description: "" })
    setSelectedPreset(newPreset)
  }

  const handleLoadPreset = (preset: SynthPreset) => {
    onLoadPreset(preset.params)
    setSelectedPreset(preset)
  }

  const handleDeletePreset = (preset: SynthPreset) => {
    if (preset.isFactory) return

    if (confirm(`Delete preset "${preset.name}"?`)) {
      PresetManager.deletePreset(preset.id)
      setPresets(PresetManager.getAllPresets())
      if (selectedPreset?.id === preset.id) {
        setSelectedPreset(null)
      }
    }
  }

  const handleExportPreset = (preset: SynthPreset) => {
    const json = PresetManager.exportPreset(preset)
    const blob = new Blob([json], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${preset.name.replace(/[^a-z0-9]/gi, "_")}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleExportAll = () => {
    const json = PresetManager.exportAllUserPresets()
    const blob = new Blob([json], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "synth_presets.json"
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImportPresets = () => {
    if (!importText.trim()) return

    const imported = PresetManager.importPresets(importText)
    if (imported > 0) {
      setPresets(PresetManager.getAllPresets())
      setShowImportDialog(false)
      setImportText("")
      alert(`Successfully imported ${imported} preset(s)!`)
    } else {
      alert("Failed to import presets. Please check the format.")
    }
  }

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      setImportText(content)
    }
    reader.readAsText(file)
  }

  return (
    <div className="space-y-2">
      {/* Compact Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" onClick={() => setShowSaveDialog(true)} className="h-5 px-1.5 text-xs">
            <Save className="h-2 w-2 mr-1" />
            Save
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportAll} className="h-5 px-1.5 text-xs">
            <FileDown className="h-2 w-2 mr-1" />
            Export
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowImportDialog(true)} className="h-5 px-1.5 text-xs">
            <FileUp className="h-2 w-2 mr-1" />
            Import
          </Button>
        </div>
      </div>

      {/* Category Filter */}
      <div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="h-6 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Compact Preset List */}
      <div className="space-y-1 max-h-24 overflow-y-auto">
        {filteredPresets.map((preset) => (
          <div
            key={preset.id}
            className={`p-1 border rounded cursor-pointer transition-colors ${
              selectedPreset?.id === preset.id
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
            }`}
            onClick={() => handleLoadPreset(preset)}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-medium truncate">{preset.name}</span>
                  {preset.isFactory ? (
                    <Star className="h-2 w-2 text-yellow-500 flex-shrink-0" />
                  ) : (
                    <User className="h-2 w-2 text-blue-500 flex-shrink-0" />
                  )}
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  <Badge variant="secondary" className="text-xs px-1 py-0 h-3">
                    {preset.category}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-0.5 ml-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleExportPreset(preset)
                  }}
                  className="h-4 w-4 p-0"
                >
                  <Download className="h-2 w-2" />
                </Button>
                {!preset.isFactory && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeletePreset(preset)
                    }}
                    className="h-4 w-4 p-0 text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-2 w-2" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredPresets.length === 0 && (
        <div className="text-center py-2 text-xs text-gray-500">No presets found in this category</div>
      )}

      {/* Save Preset Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Save Preset</DialogTitle>
            <DialogDescription>Save your current synthesizer settings as a new preset.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="preset-name">Name</Label>
              <Input
                id="preset-name"
                value={saveForm.name}
                onChange={(e) => setSaveForm({ ...saveForm, name: e.target.value })}
                placeholder="Enter preset name"
              />
            </div>
            <div>
              <Label htmlFor="preset-category">Category</Label>
              <Select
                value={saveForm.category}
                onValueChange={(value) => setSaveForm({ ...saveForm, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="User">User</SelectItem>
                  <SelectItem value="Lead">Lead</SelectItem>
                  <SelectItem value="Pad">Pad</SelectItem>
                  <SelectItem value="Bass">Bass</SelectItem>
                  <SelectItem value="Pluck">Pluck</SelectItem>
                  <SelectItem value="Bell">Bell</SelectItem>
                  <SelectItem value="FX">FX</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="preset-description">Description (optional)</Label>
              <Textarea
                id="preset-description"
                value={saveForm.description}
                onChange={(e) => setSaveForm({ ...saveForm, description: e.target.value })}
                placeholder="Describe this preset..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSavePreset} disabled={!saveForm.name.trim()}>
              Save Preset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Presets Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Import Presets</DialogTitle>
            <DialogDescription>Import presets from a JSON file or paste JSON data directly.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="file-import">Import from file</Label>
              <Input
                id="file-import"
                type="file"
                accept=".json"
                onChange={handleFileImport}
                className="cursor-pointer"
              />
            </div>
            <div className="text-center text-sm text-gray-500">or</div>
            <div>
              <Label htmlFor="json-import">Paste JSON data</Label>
              <Textarea
                id="json-import"
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="Paste preset JSON data here..."
                rows={6}
                className="font-mono text-xs"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImportDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleImportPresets} disabled={!importText.trim()}>
              Import Presets
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
