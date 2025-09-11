"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { FileImage, Upload, Calendar, MapPin, AlertCircle, CheckCircle, XCircle, Plus, Eye } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"

// Sample data for medical images
const medicalImages = {
  "x-ray": [
    {
      id: 1,
      date: "2024-01-15",
      bodyPart: "Chest",
      status: "no-findings",
      conclusions:
        "No acute cardiopulmonary abnormalities. Heart size and mediastinal contours are normal. Lungs are clear bilaterally with no evidence of consolidation, pleural effusion, or pneumothorax.",
      filename: "chest_xray_20240115.pdf",
    },
    {
      id: 2,
      date: "2023-11-20",
      bodyPart: "Left Knee",
      status: "low-risk",
      conclusions:
        "Mild degenerative changes in the medial compartment. Small joint effusion present. No acute fracture or dislocation. Recommend follow-up in 6 months if symptoms persist.",
      filename: "knee_xray_20231120.pdf",
    },
    {
      id: 3,
      date: "2023-08-10",
      bodyPart: "Lumbar Spine",
      status: "relevant",
      conclusions:
        "Moderate degenerative disc disease at L4-L5 with disc space narrowing. Mild facet arthropathy. No evidence of spondylolisthesis. Clinical correlation recommended for back pain management.",
      filename: "spine_xray_20230810.pdf",
    },
  ],
  ultrasound: [
    {
      id: 4,
      date: "2024-02-05",
      bodyPart: "Abdomen",
      status: "no-findings",
      conclusions:
        "Normal liver echotexture and size. Gallbladder, pancreas, and kidneys appear normal. No evidence of stones, masses, or fluid collections.",
      filename: "abdominal_us_20240205.pdf",
    },
    {
      id: 5,
      date: "2023-12-12",
      bodyPart: "Thyroid",
      status: "low-risk",
      conclusions:
        "Small hypoechoic nodule in right thyroid lobe measuring 8mm. Benign characteristics. Recommend routine follow-up in 12 months.",
      filename: "thyroid_us_20231212.pdf",
    },
  ],
  mri: [
    {
      id: 6,
      date: "2024-01-28",
      bodyPart: "Brain",
      status: "no-findings",
      conclusions:
        "No acute intracranial abnormalities. No evidence of infarction, hemorrhage, or mass effect. Ventricular system is normal. Age-appropriate changes only.",
      filename: "brain_mri_20240128.pdf",
    },
  ],
  "ct-scan": [
    {
      id: 7,
      date: "2023-10-15",
      bodyPart: "Chest",
      status: "relevant",
      conclusions:
        "Multiple small pulmonary nodules identified, largest measuring 6mm in the right upper lobe. Recommend follow-up CT in 3 months to assess for interval change. Clinical correlation advised.",
      filename: "chest_ct_20231015.pdf",
    },
  ],
  others: [
    {
      id: 8,
      date: "2023-09-22",
      bodyPart: "Heart",
      status: "low-risk",
      conclusions:
        "Echocardiogram shows normal left ventricular function with ejection fraction of 60%. Mild mitral regurgitation. No wall motion abnormalities detected.",
      filename: "echo_20230922.pdf",
    },
  ],
}

export default function ImagesPage() {
  const { t } = useLanguage()
  const [selectedImage, setSelectedImage] = useState<any>(null)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [conclusionsDialogOpen, setConclusionsDialogOpen] = useState(false)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "no-findings":
        return "bg-green-100 text-green-800 hover:bg-green-200"
      case "low-risk":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
      case "relevant":
        return "bg-red-100 text-red-800 hover:bg-red-200"
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "no-findings":
        return <CheckCircle className="h-4 w-4" />
      case "low-risk":
        return <AlertCircle className="h-4 w-4" />
      case "relevant":
        return <XCircle className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "no-findings":
        return t("health.images.noFindings")
      case "low-risk":
        return t("health.images.lowRiskFindings")
      case "relevant":
        return t("health.images.relevantFindings")
      default:
        return status
    }
  }

  const handleStatusClick = (image: any) => {
    setSelectedImage(image)
    setConclusionsDialogOpen(true)
  }

  const renderImageGroup = (images: any[], groupName: string) => (
    <div className="space-y-4">
      {images.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <FileImage className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>{t("health.images.noImagesInSection")}</p>
        </div>
      ) : (
        images.map((image) => (
          <Card key={image.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <FileImage className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{new Date(image.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center space-x-2 mb-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{image.bodyPart}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{image.filename}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleStatusClick(image)}
                    className={`${getStatusColor(image.status)} cursor-pointer`}
                  >
                    {getStatusIcon(image.status)}
                    <span className="ml-1">{getStatusText(image.status)}</span>
                  </Button>
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-1" />
                    {t("health.images.view")}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )

  return (
    <div className="space-y-6">
      {/* AI Summary Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileImage className="h-5 w-5" />
            {t("health.images.aiSummary")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">{t("health.images.aiSummaryContent")}</p>
          </div>
        </CardContent>
      </Card>

      {/* Upload Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{t("health.images.medicalImages")}</h2>
        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-teal-600 hover:bg-teal-700">
              <Plus className="h-4 w-4 mr-2" />
              {t("health.images.uploadImage")}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{t("health.images.uploadNewImage")}</DialogTitle>
              <DialogDescription>{t("health.images.uploadDescription")}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="image-type">{t("health.images.imageType")}</Label>
                <Select>
                  <SelectTrigger id="image-type">
                    <SelectValue placeholder={t("health.images.selectImageType")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="x-ray">{t("health.images.xray")}</SelectItem>
                    <SelectItem value="ultrasound">{t("health.images.ultrasound")}</SelectItem>
                    <SelectItem value="mri">{t("health.images.mri")}</SelectItem>
                    <SelectItem value="ct-scan">{t("health.images.ctScan")}</SelectItem>
                    <SelectItem value="others">{t("health.images.others")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="body-part">{t("health.images.bodyPart")}</Label>
                <Input id="body-part" placeholder={t("health.images.bodyPartPlaceholder")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="image-date">{t("health.images.imageDate")}</Label>
                <Input id="image-date" type="date" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">{t("health.images.findings")}</Label>
                <Select>
                  <SelectTrigger id="status">
                    <SelectValue placeholder={t("health.images.selectFindings")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no-findings">{t("health.images.noFindings")}</SelectItem>
                    <SelectItem value="low-risk">{t("health.images.lowRiskFindings")}</SelectItem>
                    <SelectItem value="relevant">{t("health.images.relevantFindings")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="conclusions">{t("health.images.conclusions")}</Label>
                <Textarea
                  id="conclusions"
                  placeholder={t("health.images.conclusionsPlaceholder")}
                  className="min-h-[100px]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="file-upload">{t("health.images.uploadFile")}</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-600">{t("health.images.dragDropOrClick")}</p>
                  <p className="text-xs text-gray-500 mt-1">{t("health.images.supportedFormats")}</p>
                  <Input id="file-upload" type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.dcm" />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
                  {t("action.cancel")}
                </Button>
                <Button className="bg-teal-600 hover:bg-teal-700" onClick={() => setUploadDialogOpen(false)}>
                  {t("health.images.uploadImage")}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Image Sections */}
      <div className="space-y-6">
        {/* X-Ray Section */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <FileImage className="h-5 w-5 text-teal-600" />
              {t("health.images.xray")}
            </CardTitle>
          </CardHeader>
          <CardContent>{renderImageGroup(medicalImages["x-ray"], "X-Ray")}</CardContent>
        </Card>

        {/* Ultrasound Section */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <FileImage className="h-5 w-5 text-teal-600" />
              {t("health.images.ultrasound")}
            </CardTitle>
          </CardHeader>
          <CardContent>{renderImageGroup(medicalImages["ultrasound"], "Ultrasound")}</CardContent>
        </Card>

        {/* MRI Section */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <FileImage className="h-5 w-5 text-teal-600" />
              {t("health.images.mri")}
            </CardTitle>
          </CardHeader>
          <CardContent>{renderImageGroup(medicalImages["mri"], "MRI")}</CardContent>
        </Card>

        {/* CT Scan Section */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <FileImage className="h-5 w-5 text-teal-600" />
              {t("health.images.ctScan")}
            </CardTitle>
          </CardHeader>
          <CardContent>{renderImageGroup(medicalImages["ct-scan"], "CT Scan")}</CardContent>
        </Card>

        {/* Others Section */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <FileImage className="h-5 w-5 text-teal-600" />
              {t("health.images.others")}
            </CardTitle>
          </CardHeader>
          <CardContent>{renderImageGroup(medicalImages["others"], "Others")}</CardContent>
        </Card>
      </div>

      {/* Conclusions Dialog */}
      <Dialog open={conclusionsDialogOpen} onOpenChange={setConclusionsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedImage && getStatusIcon(selectedImage.status)}
              {t("health.images.reportConclusions")}
            </DialogTitle>
            <DialogDescription>
              {selectedImage && (
                <div className="flex items-center gap-4 text-sm">
                  <span>{new Date(selectedImage.date).toLocaleDateString()}</span>
                  <span>•</span>
                  <span>{selectedImage.bodyPart}</span>
                  <span>•</span>
                  <Badge className={getStatusColor(selectedImage.status)}>{getStatusText(selectedImage.status)}</Badge>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium mb-2">{t("health.images.medicalConclusions")}</h4>
              <p className="text-sm text-gray-700 leading-relaxed">{selectedImage?.conclusions}</p>
            </div>
          </div>
          <div className="flex justify-end space-x-2 mt-6">
            <Button variant="outline" onClick={() => setConclusionsDialogOpen(false)}>
              {t("action.cancel")}
            </Button>
            <Button className="bg-teal-600 hover:bg-teal-700">
              <Eye className="h-4 w-4 mr-2" />
              {t("health.images.viewFullReport")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
