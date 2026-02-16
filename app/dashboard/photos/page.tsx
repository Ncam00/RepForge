"use client"

import { useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { Camera, Upload, Trash2, Image as ImageIcon, RotateCcw, ArrowLeftRight, Grid, X } from "lucide-react"
import PhotoCompareSlider from "@/components/PhotoCompareSlider"
import { ProgressPhoto, PhotoComparison } from "@/types/dashboard"

type PhotoCategory = "front" | "side" | "back"

export default function ProgressPhotosPage() {
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [selectedCategory, setSelectedCategory] = useState<PhotoCategory>("front")
  const [uploadCategory, setUploadCategory] = useState<PhotoCategory>("front")
  const [notes, setNotes] = useState("")
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<"compare" | "gallery">("compare")
  const [selectedBeforeId, setSelectedBeforeId] = useState<string | null>(null)
  const [selectedAfterId, setSelectedAfterId] = useState<string | null>(null)
  const [lightboxPhoto, setLightboxPhoto] = useState<ProgressPhoto | null>(null)

  // Fetch comparison data
  const { data: comparisonData, isLoading: loadingComparison } = useQuery({
    queryKey: ["photo-comparison", selectedCategory],
    queryFn: async () => {
      const res = await fetch(`/api/progress-photos/compare?category=${selectedCategory}`)
      if (!res.ok) throw new Error("Failed to fetch comparison")
      return res.json() as Promise<PhotoComparison>
    },
  })

  // Fetch all photos for gallery
  const { data: photosData } = useQuery({
    queryKey: ["progress-photos"],
    queryFn: async () => {
      const res = await fetch("/api/progress-photos")
      if (!res.ok) throw new Error("Failed to fetch photos")
      return res.json() as Promise<{ photos: ProgressPhoto[] }>
    },
  })

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (data: { imageData: string; category: string; notes?: string }) => {
      const res = await fetch("/api/progress-photos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error("Failed to upload photo")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["progress-photos"] })
      queryClient.invalidateQueries({ queryKey: ["photo-comparison"] })
      setPreviewImage(null)
      setNotes("")
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (photoId: string) => {
      const res = await fetch(`/api/progress-photos?id=${photoId}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed to delete photo")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["progress-photos"] })
      queryClient.invalidateQueries({ queryKey: ["photo-comparison"] })
      setLightboxPhoto(null)
    },
  })

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 10 * 1024 * 1024) {
      alert("Photo must be less than 10MB")
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setPreviewImage(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleUpload = () => {
    if (!previewImage) return
    uploadMutation.mutate({
      imageData: previewImage,
      category: uploadCategory,
      notes: notes || undefined,
    })
  }

  const handleCameraCapture = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  // Get selected photos for comparison
  const getBeforePhoto = () => {
    if (selectedBeforeId && comparisonData?.timeline) {
      return comparisonData.timeline.find(p => p.id === selectedBeforeId)
    }
    return comparisonData?.before
  }

  const getAfterPhoto = () => {
    if (selectedAfterId && comparisonData?.timeline) {
      return comparisonData.timeline.find(p => p.id === selectedAfterId)
    }
    return comparisonData?.after
  }

  const categories: { value: PhotoCategory; label: string; icon: string }[] = [
    { value: "front", label: "Front", icon: "👤" },
    { value: "side", label: "Side", icon: "🧍" },
    { value: "back", label: "Back", icon: "🔙" },
  ]

  const allPhotos = photosData?.photos || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Progress Photos</h1>
          <p className="text-muted-foreground mt-1">
            Track your transformation with before and after photos
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === "compare" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("compare")}
            className="gap-2"
          >
            <ArrowLeftRight className="h-4 w-4" />
            Compare
          </Button>
          <Button
            variant={viewMode === "gallery" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("gallery")}
            className="gap-2"
          >
            <Grid className="h-4 w-4" />
            Gallery
          </Button>
        </div>
      </div>

      {/* Photo Stats */}
      {comparisonData && (
        <div className="grid grid-cols-4 gap-4">
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold">{comparisonData.counts.total}</div>
              <div className="text-sm text-muted-foreground">Total Photos</div>
            </CardContent>
          </Card>
          <Card className={`text-center cursor-pointer transition-all ${selectedCategory === "front" ? "ring-2 ring-primary" : ""}`} onClick={() => setSelectedCategory("front")}>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold">{comparisonData.counts.front}</div>
              <div className="text-sm text-muted-foreground">👤 Front</div>
            </CardContent>
          </Card>
          <Card className={`text-center cursor-pointer transition-all ${selectedCategory === "side" ? "ring-2 ring-primary" : ""}`} onClick={() => setSelectedCategory("side")}>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold">{comparisonData.counts.side}</div>
              <div className="text-sm text-muted-foreground">🧍 Side</div>
            </CardContent>
          </Card>
          <Card className={`text-center cursor-pointer transition-all ${selectedCategory === "back" ? "ring-2 ring-primary" : ""}`} onClick={() => setSelectedCategory("back")}>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold">{comparisonData.counts.back}</div>
              <div className="text-sm text-muted-foreground">🔙 Back</div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Add Progress Photo
            </CardTitle>
            <CardDescription>
              Take a new photo or upload from your gallery
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Category Selection */}
            <div className="space-y-2">
              <Label>Photo Type</Label>
              <div className="grid grid-cols-3 gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => setUploadCategory(cat.value)}
                    className={`p-3 rounded-lg border-2 text-center transition-all ${
                      uploadCategory === cat.value
                        ? "border-primary bg-primary/10"
                        : "border-input hover:border-primary/50"
                    }`}
                  >
                    <div className="text-2xl mb-1">{cat.icon}</div>
                    <div className="text-sm font-medium">{cat.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Preview / Upload Area */}
            {previewImage ? (
              <div className="space-y-4">
                <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-muted">
                  <img
                    src={previewImage}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={() => setPreviewImage(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (optional)</Label>
                  <Input
                    id="notes"
                    placeholder="e.g., Week 4, feeling stronger"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
                <Button
                  onClick={handleUpload}
                  disabled={uploadMutation.isPending}
                  className="w-full gap-2"
                >
                  <Upload className="h-4 w-4" />
                  {uploadMutation.isPending ? "Uploading..." : "Save Photo"}
                </Button>
              </div>
            ) : (
              <div
                onClick={handleCameraCapture}
                className="aspect-[3/4] rounded-lg border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-all"
              >
                <Camera className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-sm font-medium">Tap to take or upload photo</p>
                <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 10MB</p>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
              className="hidden"
            />
          </CardContent>
        </Card>

        {/* Comparison / Gallery Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {viewMode === "compare" ? (
                <>
                  <ArrowLeftRight className="h-5 w-5" />
                  Before & After Comparison
                </>
              ) : (
                <>
                  <Grid className="h-5 w-5" />
                  Photo Gallery
                </>
              )}
            </CardTitle>
            {viewMode === "compare" && (
              <CardDescription>
                Drag the slider to compare your progress
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {viewMode === "compare" ? (
              <>
                {loadingComparison ? (
                  <div className="aspect-[3/4] rounded-lg bg-muted animate-pulse flex items-center justify-center">
                    <RotateCcw className="h-8 w-8 text-muted-foreground animate-spin" />
                  </div>
                ) : comparisonData?.hasSufficientPhotos && getBeforePhoto() && getAfterPhoto() ? (
                  <div className="space-y-4">
                    <PhotoCompareSlider
                      beforeImage={getBeforePhoto()!.imageData}
                      afterImage={getAfterPhoto()!.imageData}
                      beforeDate={getBeforePhoto()!.date}
                      afterDate={getAfterPhoto()!.date}
                    />
                    
                    {/* Timeline selector */}
                    {comparisonData.timeline.length > 2 && (
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Select photos to compare</Label>
                        <div className="flex gap-2 overflow-x-auto pb-2">
                          {comparisonData.timeline.map((photo, idx) => (
                            <button
                              key={photo.id}
                              onClick={() => {
                                if (!selectedBeforeId || (selectedBeforeId && selectedAfterId)) {
                                  setSelectedBeforeId(photo.id)
                                  setSelectedAfterId(null)
                                } else {
                                  setSelectedAfterId(photo.id)
                                }
                              }}
                              className={`relative flex-shrink-0 w-16 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                                selectedBeforeId === photo.id
                                  ? "border-blue-500"
                                  : selectedAfterId === photo.id
                                  ? "border-green-500"
                                  : "border-transparent hover:border-primary/50"
                              }`}
                            >
                              <img
                                src={photo.imageData}
                                alt={`Photo ${idx + 1}`}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] text-center py-0.5">
                                {format(new Date(photo.date), "MM/dd")}
                              </div>
                            </button>
                          ))}
                        </div>
                        {(selectedBeforeId || selectedAfterId) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedBeforeId(null)
                              setSelectedAfterId(null)
                            }}
                            className="text-xs"
                          >
                            <RotateCcw className="h-3 w-3 mr-1" />
                            Reset to oldest/newest
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="aspect-[3/4] rounded-lg bg-muted/50 border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center">
                    <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-sm font-medium text-center px-4">
                      {comparisonData?.counts.total === 0
                        ? "No photos yet"
                        : `Need at least 2 ${selectedCategory} photos to compare`}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Upload your first progress photo to get started
                    </p>
                  </div>
                )}
              </>
            ) : (
              /* Gallery View */
              <div className="space-y-4">
                {allPhotos.length === 0 ? (
                  <div className="aspect-video rounded-lg bg-muted/50 border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center">
                    <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-sm font-medium">No photos yet</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {allPhotos.map((photo) => (
                      <button
                        key={photo.id}
                        onClick={() => setLightboxPhoto(photo)}
                        className="relative aspect-[3/4] rounded-lg overflow-hidden group"
                      >
                        <img
                          src={photo.imageData}
                          alt={`Progress photo - ${photo.category}`}
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                          <div className="text-white text-xs font-medium capitalize">{photo.category}</div>
                          <div className="text-white/70 text-[10px]">
                            {format(new Date(photo.date), "MMM d, yyyy")}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Lightbox */}
      {lightboxPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxPhoto(null)}
        >
          <div
            className="relative max-w-2xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={lightboxPhoto.imageData}
              alt="Progress photo"
              className="w-full rounded-lg"
            />
            <div className="absolute top-4 right-4 flex gap-2">
              <Button
                variant="destructive"
                size="icon"
                onClick={() => {
                  if (confirm("Delete this photo?")) {
                    deleteMutation.mutate(lightboxPhoto.id)
                  }
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                onClick={() => setLightboxPhoto(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="absolute bottom-4 left-4 right-4 bg-black/60 rounded-lg p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold capitalize">{lightboxPhoto.category} View</div>
                  <div className="text-sm text-white/70">
                    {format(new Date(lightboxPhoto.date), "MMMM d, yyyy")}
                  </div>
                </div>
                {lightboxPhoto.notes && (
                  <div className="text-sm text-white/70 max-w-[200px] text-right">
                    {lightboxPhoto.notes}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
