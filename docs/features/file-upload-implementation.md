# File Upload Implementation Guide

## Overview

TroponinIQ users want to upload files for enhanced nutrition coaching:
- **Food photos** for meal analysis and portion estimation
- **Progress photos** for body composition tracking
- **Documents** (meal plans, lab results) for comprehensive coaching

## Current Status

- ✅ **Frontend UI**: Ready and functional in `components/chat/multimodal-input.tsx`
- 🚧 **Backend API**: Disabled but documented in `app/api/chat/files/upload/route.ts`
- ❌ **Storage**: Not configured (needs implementation)

## Implementation Options

### Option 1: Firebase Storage (Recommended)

**Pros:**
- Integrates with existing Firestore database
- Built-in security rules
- Image optimization capabilities
- Consistent with TroponinIQ ecosystem

**Setup Steps:**
```bash
# 1. Enable Firebase Storage in console
# 2. Configure environment variables
FIREBASE_STORAGE_BUCKET=your-project.appspot.com

# 3. Install Firebase client SDK (if needed)
pnpm add firebase
```

**Implementation:**
```typescript
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const storage = getStorage();
const storageRef = ref(storage, `nutrition-coaching/${userId}/${filename}`);
const uploadResult = await uploadBytes(storageRef, fileBuffer);
const downloadURL = await getDownloadURL(uploadResult.ref);
```

### Option 2: Vercel Blob Storage

**Pros:**
- Simple implementation
- Good for quick deployment
- Built-in CDN

**Setup Steps:**
```bash
# 1. Add environment variable
BLOB_READ_WRITE_TOKEN=your-vercel-blob-token

# 2. Already installed: @vercel/blob
```

### Option 3: AWS S3

**Pros:**
- Most scalable
- Advanced AI analysis features
- Enterprise-grade

**Setup Steps:**
```bash
# 1. Configure AWS credentials
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_REGION=us-east-1
S3_BUCKET_NAME=troponiniq-uploads
```

## Security Implementation

### File Validation
```typescript
// Size limits by file type
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024; // 10MB

// Allowed file types
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png', 
  'image/webp',
  'image/heic', // iPhone photos
  'application/pdf'
];
```

### Privacy & Security
- **EXIF data stripping** from photos
- **Virus scanning** for production
- **Content moderation** for inappropriate images
- **User authentication** required
- **Rate limiting** to prevent abuse

## AI Integration Features

### Food Photo Analysis
```typescript
// Potential AI features for food photos
const analyzeFood = async (imageUrl: string) => {
  // 1. Food recognition
  // 2. Portion size estimation
  // 3. Nutritional content estimation
  // 4. Meal logging suggestions
};
```

### Progress Photo Analysis
```typescript
// Potential AI features for progress photos
const analyzeProgress = async (imageUrl: string) => {
  // 1. Body composition estimation
  // 2. Progress comparison with previous photos
  // 3. Measurement suggestions
  // 4. Goal tracking updates
};
```

## Database Schema

### File Metadata Storage (Firestore)
```typescript
interface UploadedFile {
  id: string;
  userId: string;
  filename: string;
  originalName: string;
  fileType: 'food_photo' | 'progress_photo' | 'document';
  contentType: string;
  size: number;
  storageUrl: string;
  thumbnailUrl?: string;
  uploadedAt: Timestamp;
  chatId?: string; // If uploaded in chat context
  aiAnalysis?: {
    foodItems?: string[];
    nutritionalInfo?: object;
    bodyMetrics?: object;
    extractedText?: string;
  };
}
```

## User Experience Flow

### Upload Process
1. User drags/selects file in chat interface
2. Frontend validates file type and size
3. Upload progress shown in UI
4. Backend processes and stores file
5. AI analysis runs (if applicable)
6. File becomes available in chat context
7. User receives analysis results

### Error Handling
- Clear error messages for file type/size issues
- Retry mechanism for failed uploads
- Graceful degradation if AI analysis fails
- Upload progress with cancel option

## Testing Strategy

### Manual Testing
- [ ] Upload various image formats (JPEG, PNG, WebP, HEIC)
- [ ] Upload PDF documents
- [ ] Test file size limits
- [ ] Test error conditions
- [ ] Test mobile photo uploads
- [ ] Test drag & drop functionality

### Automated Testing
```typescript
// Example test cases
describe('File Upload API', () => {
  it('should accept valid food photos');
  it('should reject oversized files');
  it('should require authentication');
  it('should strip EXIF data');
  it('should generate thumbnails');
});
```

## Deployment Checklist

### Pre-deployment
- [ ] Configure storage backend
- [ ] Set up environment variables
- [ ] Implement file validation
- [ ] Add virus scanning
- [ ] Configure rate limiting
- [ ] Set up monitoring

### Post-deployment
- [ ] Monitor upload success rates
- [ ] Track storage usage
- [ ] Monitor AI analysis performance
- [ ] Collect user feedback
- [ ] Optimize based on usage patterns

## Cost Considerations

### Storage Costs
- **Firebase Storage**: ~$0.026/GB/month
- **Vercel Blob**: ~$0.15/GB/month
- **AWS S3**: ~$0.023/GB/month

### AI Analysis Costs
- Food recognition API calls
- Image processing compute time
- OCR for document text extraction

### Optimization Strategies
- Image compression before storage
- Thumbnail generation for quick previews
- Intelligent caching
- Batch processing for AI analysis

## Success Metrics

### User Engagement
- Upload frequency per user
- File type distribution
- Chat engagement after uploads
- Feature adoption rate

### Technical Performance
- Upload success rate (target: >99%)
- Average upload time (target: <10s)
- AI analysis accuracy
- Storage efficiency

## Next Steps

1. **Choose storage provider** (Firebase Storage recommended)
2. **Configure development environment** with storage credentials
3. **Enable upload endpoint** by removing 501 response
4. **Implement basic file processing** (validation, storage)
5. **Add AI analysis features** incrementally
6. **Deploy to staging** for user testing
7. **Gather feedback** and iterate
8. **Production deployment** with monitoring

---

*This feature will significantly enhance the TroponinIQ coaching experience by enabling visual context for nutrition guidance.*
