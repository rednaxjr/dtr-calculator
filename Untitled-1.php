public function video(AccessFileRequest $request): Response
    {
        $path = $request->query('path');

        $disk = $request->query('disk', 'main');

        abort_if(Storage::disk($disk)->missing($path), Response::HTTP_NOT_FOUND);

        $mimeType = Storage::disk($disk)->mimeType($path);

        abort_if(! Str::contains($mimeType, 'video'), Response::HTTP_NOT_FOUND);

        return response()
            ->make('', Response::HTTP_OK)
            ->header('X-Accel-Redirect', app()->joinPaths('/'.$disk, $path))
            ->header('Content-Type', $mimeType)
            ->header('Content-Length', Storage::disk($disk)->size($path))
            ->header('Content-Disposition', 'inline; filename="'.basename($path).'"')
            ->header('Accept-Ranges', 'bytes')
            ->header('Cache-Control', 'no-store')
            ->header('X-Content-Type-Options', 'nosniff');
    }