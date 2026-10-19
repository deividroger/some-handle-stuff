package main

import (
	"context"
	"errors"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	_ "some-handle-stuff/docs"
	"some-handle-stuff/internal/adapters/inbound/httpapi"
	"some-handle-stuff/internal/adapters/outbound/idgen"
	"some-handle-stuff/internal/adapters/outbound/postgres"
	"some-handle-stuff/internal/core/service"
)

// @title Tasks API
// @version 1.0
// @description API de tarefas construída com arquitetura ports and adapters.
// @BasePath /
func main() {
	if err := run(); err != nil {
		log.Fatal(err)
	}
}

// run is the composition root: the only place that knows concrete adapters.
func run() error {
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		return errors.New("DATABASE_URL is required")
	}
	addr := getenv("HTTP_ADDR", ":8080")

	if err := postgres.Migrate(dbURL); err != nil {
		return err
	}
	pool, err := postgres.Connect(ctx, dbURL)
	if err != nil {
		return err
	}
	defer pool.Close()

	svc := service.NewTaskService(postgres.NewTaskRepository(pool), idgen.Random{})
	srv := &http.Server{
		Addr:              addr,
		Handler:           httpapi.NewHandler(svc),
		ReadHeaderTimeout: 5 * time.Second,
	}

	errCh := make(chan error, 1)
	go func() {
		log.Printf("listening on %s", addr)
		errCh <- srv.ListenAndServe()
	}()

	select {
	case err := <-errCh:
		return err
	case <-ctx.Done():
	}

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	return srv.Shutdown(shutdownCtx)
}

func getenv(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}
