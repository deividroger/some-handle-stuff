package service_test

import (
	"context"
	"errors"
	"testing"

	"some-handle-stuff/internal/core/domain"
	"some-handle-stuff/internal/core/service"
)

type fakeRepo struct{ tasks map[string]domain.Task }

func newFakeRepo() *fakeRepo { return &fakeRepo{tasks: map[string]domain.Task{}} }

func (r *fakeRepo) Save(_ context.Context, t domain.Task) error { r.tasks[t.ID] = t; return nil }

func (r *fakeRepo) FindByID(_ context.Context, id string) (domain.Task, error) {
	t, ok := r.tasks[id]
	if !ok {
		return domain.Task{}, domain.ErrTaskNotFound
	}
	return t, nil
}

func (r *fakeRepo) List(context.Context) ([]domain.Task, error) {
	out := []domain.Task{}
	for _, t := range r.tasks {
		out = append(out, t)
	}
	return out, nil
}

func (r *fakeRepo) Delete(_ context.Context, id string) error {
	if _, ok := r.tasks[id]; !ok {
		return domain.ErrTaskNotFound
	}
	delete(r.tasks, id)
	return nil
}

type fixedID struct{}

func (fixedID) NewID() string { return "1" }

func TestCreateCompleteListDelete(t *testing.T) {
	svc := service.NewTaskService(newFakeRepo(), fixedID{})
	ctx := context.Background()

	task, err := svc.Create(ctx, "write tests")
	if err != nil {
		t.Fatal(err)
	}
	done, err := svc.Complete(ctx, task.ID)
	if err != nil || !done.Done {
		t.Fatalf("expected completed task, got %+v, err %v", done, err)
	}
	if list, _ := svc.List(ctx); len(list) != 1 {
		t.Fatalf("expected 1 task, got %d", len(list))
	}
	if err := svc.Delete(ctx, task.ID); err != nil {
		t.Fatal(err)
	}
	if err := svc.Delete(ctx, task.ID); !errors.Is(err, domain.ErrTaskNotFound) {
		t.Fatalf("expected ErrTaskNotFound, got %v", err)
	}
}

func TestCreateInvalidTitle(t *testing.T) {
	svc := service.NewTaskService(newFakeRepo(), fixedID{})
	if _, err := svc.Create(context.Background(), ""); !errors.Is(err, domain.ErrInvalidTitle) {
		t.Fatalf("expected ErrInvalidTitle, got %v", err)
	}
}
